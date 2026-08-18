"""真实大模型（OpenAI 兼容端点）调用层。

职责：
- 维护 OpenAI 客户端单例（按配置懒加载，复用连接）
- 定义 JD / 简历分析的结构化输出 Pydantic 模型（camelCase，对齐前端契约）
- 提供「分层防御」的 JSON 解析：剥离围栏 -> 提取首个完整 JSON -> Pydantic 校验 -> 把错误回灌模型重试
- 暴露 generate_jd / refine_jd / generate_screening 三个函数，返回 camelCase dict，
  与 services/mock_ai.py 的返回结构完全一致，便于路由层优雅降级。

若端点不支持 response_format 或鉴权失败，会抛 LLMCallError，由路由层回退 mock。
"""
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Literal, Optional

from openai import (
    APIConnectionError,
    APIError,
    APIStatusError,
    OpenAI,
    RateLimitError,
)
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings


# --------------------------------------------------------------------------- #
# 异常
# --------------------------------------------------------------------------- #
class LLMCallError(Exception):
    """大模型调用/解析失败（供路由层捕获并降级到 mock）。"""


# --------------------------------------------------------------------------- #
# 输出结构
# --------------------------------------------------------------------------- #
class JdContentOutput(BaseModel):
    """JD 中由大模型生成的「内容字段」。

    9 个结构化元数据字段（title/department/level/salaryRange/experience/
    education/location/workMode/benefits）由 HR 在前端手写，大模型不参与生成，
    仅作为生成内容的上下文参考。
    """

    oneSentencePitch: str
    responsibilities: List[str]
    requirements: List[str]
    preferredSkills: List[str]


class DimensionScores(BaseModel):
    hardSkills: int = Field(ge=0, le=100)
    experienceMatch: int = Field(ge=0, le=100)
    stabilityGrowth: int = Field(ge=0, le=100)
    compensationFit: int = Field(ge=0, le=100)
    softSkills: int = Field(ge=0, le=100)


class RecommendedQuestion(BaseModel):
    category: str
    question: str
    reason: str


class ScreeningOutput(BaseModel):
    candidateName: str
    appliedRole: str
    experienceYears: int
    education: str
    currentCompany: str
    currentRole: str
    overallScore: int = Field(ge=0, le=100)
    matchLevel: Literal["EXCELLENT", "GOOD", "AVERAGE"]
    recommendation: str
    dimensionScores: DimensionScores
    summary: str
    keyHighlights: List[str]
    potentialRisks: List[str]
    recommendedQuestions: List[RecommendedQuestion]


# --------------------------------------------------------------------------- #
# 客户端单例
# --------------------------------------------------------------------------- #
_client: Optional[OpenAI] = None


def get_client() -> Optional[OpenAI]:
    """懒加载并复用 OpenAI 客户端；无 key 时返回 None。"""
    global _client
    if _client is None and settings.llm_api_key:
        _client = OpenAI(
            api_key=settings.llm_api_key,
            base_url=settings.llm_base_url,
            timeout=settings.llm_timeout,
        )
    return _client


def llm_available() -> bool:
    return bool(settings.llm_api_key)


# --------------------------------------------------------------------------- #
# 健壮 JSON 解析（分层防御）
# --------------------------------------------------------------------------- #
def extract_json(text: str) -> str:
    """从 LLM 输出中提取首个完整 JSON 字符串。

    处理：1) 去除 ```json 围栏；2) 剥离首尾空白后若整体是被围栏包裹的对象；
    3) 否则按括号配平提取首个 {...}（兼容前文有少量说明文字的情况）。
    """
    if not text or not text.strip():
        raise ValueError("LLM 返回内容为空")

    raw = text.strip()

    # 1) 整体被 ```...``` 包裹
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```$", raw, re.DOTALL | re.IGNORECASE)
    if fence:
        return fence.group(1).strip()

    # 2) 提取首个配平 {...}
    start = raw.find("{")
    if start != -1:
        depth = 0
        in_str = False
        escaped = False
        for i in range(start, len(raw)):
            ch = raw[i]
            if escaped:
                escaped = False
                continue
            if ch == "\\":
                escaped = True
                continue
            if ch == '"':
                in_str = not in_str
                continue
            if in_str:
                continue
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return raw[start : i + 1]

    # 3) 实在没有对象，原样返回（交给后续校验报错并重试）
    return raw


def call_llm_json(
    system_prompt: str,
    user_prompt: str,
    model_cls: type[BaseModel],
    temperature: Optional[float] = None,
) -> BaseModel:
    """调用大模型并解析为指定 Pydantic 模型。

    失败时把错误回灌模型自我修正，最多重试 settings.llm_max_retries 次；
    仍失败则抛 LLMCallError。
    """
    client = get_client()
    if client is None:
        raise LLMCallError("LLM 客户端不可用（未配置 LLM_API_KEY）")

    temp = settings.llm_temperature if temperature is None else temperature
    messages: List[Dict[str, str]] = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    last_err: Optional[Exception] = None
    attempts = max(1, settings.llm_max_retries + 1)
    for attempt in range(attempts):
        try:
            resp = client.chat.completions.create(
                model=settings.llm_model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=temp,
            )
            content = resp.choices[0].message.content or ""
            clean = extract_json(content)
            return model_cls.model_validate_json(clean)
        except (json.JSONDecodeError, ValidationError) as e:
            last_err = e
            # 自我修正：把校验错误回灌，要求严格按 schema 只输出 JSON
            messages.append(
                {
                    "role": "user",
                    "content": (
                        f"上一次返回不是合法 JSON 或字段不符合要求，错误：{e}\n"
                        "请严格按给定 schema 只输出一个 JSON 对象，不要任何额外文字或 Markdown 围栏。"
                    ),
                }
            )
            temp = 0.0  # 修正阶段更确定
            continue
        except (APIConnectionError, RateLimitError, APIStatusError, APIError) as e:
            raise LLMCallError(f"LLM API 调用失败：{e}") from e

    raise LLMCallError(
        f"LLM 输出经 {settings.llm_max_retries} 次重试仍无法解析：{last_err}"
    )


# --------------------------------------------------------------------------- #
# 提示词
# --------------------------------------------------------------------------- #
JD_SYSTEM = """你是一位拥有 15 年经验的资深 HRD 与招聘专家，擅长为技术岗位撰写专业、精准、有吸引力且符合真实招聘场景的职位描述（JD）。

# 你的职责边界
- 岗位的结构化元数据（职位名称、用人部门、职级、薪资、经验、学历、工作地点、工作模式、薪酬福利）**全部由 HR 在前端填写，你不需要也不允许生成这些字段**。
- 你只需要基于 HR 提供的岗位背景信息，撰写 JD 的「内容部分」：一句话亮点、工作职责、任职要求、优先加分项。

# 输出要求
1. 必须且只能输出一个 JSON 对象，不要任何 Markdown 围栏、不要解释性文字、不要代码块。
2. 严格使用以下 4 个键名（camelCase，不得增删或改名）：
   - oneSentencePitch: 一句话亮点文案（突出价值主张，1 句）
   - responsibilities: 工作职责数组（3-5 条字符串，具体、可执行）
   - requirements: 任职要求数组（3-5 条字符串）
   - preferredSkills: 优先条件数组（2-3 条字符串）

3. 内容须真实、专业、贴合岗位背景，职责与要求应相互呼应；不得留空。
"""

JD_REFINE_SYSTEM = """你是一位资深 HRD 与招聘专家。你会收到一份已有的职位描述（JSON）以及一条修改指令。

# 你的职责边界
- 岗位的结构化元数据字段（title/department/level/salaryRange/experience/education/location/workMode/benefits）由 HR 维护，**你不得修改它们**。
- 你只需基于修改指令，重写 JD 的「内容部分」：oneSentencePitch / responsibilities / requirements / preferredSkills。

# 输出要求
1. 必须且只能输出一个 JSON 对象，不要 Markdown 围栏、不要解释文字。
2. 键名严格为 4 个：oneSentencePitch, responsibilities, requirements, preferredSkills（camelCase）。
3. 返回的是这 4 个内容字段（不要包含任何结构化元数据字段），按指令调整后的新内容。
"""

SCREENING_SYSTEM = """你是一位资深技术招聘官与人才评估专家，负责基于候选人简历正文与目标职位描述（JD）进行真实、客观、可解释的评估。

# 核心原则
1. 必须且只能输出一个 JSON 对象，不要 Markdown 围栏、不要解释文字。
2. 严格使用以下键名（camelCase，不得增删或改名）：
   - candidateName: 候选人姓名（字符串）
   - appliedRole: 应聘/目标职位（字符串）
   - experienceYears: 相关工作年限（整数，注意分析是从现在时间与最高学历的毕业时间相差计算）
   - education: 最高学历（字符串,注意是最高学历是哪个学校）
   - currentCompany: 当前/最近公司（字符串）
   - currentRole: 当前/最近职位（字符串）
   - overallScore: 综合得分（0-100 整数）
   - matchLevel: 匹配等级，仅取 "EXCELLENT" / "GOOD" / "AVERAGE" 之一
   - recommendation: 推荐结论（如 "强烈推荐" / "建议初试" / "谨慎考虑"）
   - dimensionScores: 对象，含五个 0-100 整数：
       hardSkills（硬技能匹配）、experienceMatch（经验匹配）、
       stabilityGrowth（稳定性与成长性）、compensationFit（薪酬匹配）、
       softSkills（软技能与文化契合）
   - summary: 一句话综合评语（字符串）
   - keyHighlights: 核心亮点数组（3 条字符串）
   - potentialRisks: 潜在风险数组（2 条字符串）
   - recommendedQuestions: 面试追问数组（3 条），每条含：
       category（考察维度）、question（具体问题）、reason（考察目的）
3. 所有分数必须来自对简历正文与目标 JD 的真实分析，严禁随机或凭空给分；
   overallScore 应为五维分数的合理加权（高匹配约 85-95，中等 70-84，偏弱 60-69）。
4. 维度分数需与评语、亮点、风险自洽；recommendedQuestions 应紧扣该候选人的真实情况。
"""


# --------------------------------------------------------------------------- #
# 对外函数（返回 camelCase dict，与 mock_ai 保持一致）
# --------------------------------------------------------------------------- #
def _build_jd_user_prompt(
    *,
    job_title: str,
    department: Optional[str],
    seniority: Optional[str],
    experience_level: Optional[str],
    education_level: Optional[str],
    salary_range: Optional[str],
    key_skills: Optional[str],
    core_duties_input: Optional[str],
    work_mode: Optional[str],
    location: Optional[str],
    benefits: Optional[list],
    tone: Optional[str],
) -> str:
    schema = json.dumps(
        JdContentOutput.model_json_schema(), ensure_ascii=False, indent=2
    )
    return f"""以下是 HR 已填写的岗位结构化信息（仅供你撰写内容时参考，**不要作为输出字段**）：

# 岗位背景信息（HR 填写）
- 职位名称：{job_title}
- 用人部门：{department or '未指定'}
- 目标职级：{seniority or '未指定'}
- 经验要求：{experience_level or '未指定'}
- 学历要求：{education_level or '未指定'}
- 薪资范围：{salary_range or '未指定'}
- 工作地点：{location or '未指定'}
- 工作模式：{work_mode or '未指定'}
- 薪酬福利：{benefits if benefits else '未指定'}
- 核心技术/技能：{key_skills or '未指定'}
- 核心业务场景/重点诉求：{core_duties_input or '无'}
- 文案风格：{tone or '专业、务实'}

请仅基于以上背景，撰写 JD 的内容部分，严格按 system 规定的 4 个键名输出 JSON。

# 输出 JSON Schema（仅作结构参考，键名必须一致）
{schema}
"""


def generate_jd(
    *,
    job_title: str,
    department: Optional[str] = None,
    seniority: Optional[str] = None,
    experience_level: Optional[str] = None,
    education_level: Optional[str] = None,
    salary_range: Optional[str] = None,
    key_skills: Optional[str] = None,
    core_duties_input: Optional[str] = None,
    work_mode: Optional[str] = None,
    location: Optional[str] = None,
    benefits: Optional[list] = None,
    tone: Optional[str] = None,
) -> Dict[str, Any]:
    """生成 JD 的「内容字段」（一句话亮点/职责/要求/加分项）。

    9 个结构化元数据字段由 HR 提供、仅作为上下文传入，大模型不生成它们。
    """
    user_prompt = _build_jd_user_prompt(
        job_title=job_title,
        department=department,
        seniority=seniority,
        experience_level=experience_level,
        education_level=education_level,
        salary_range=salary_range,
        key_skills=key_skills,
        core_duties_input=core_duties_input,
        work_mode=work_mode,
        location=location,
        benefits=benefits,
        tone=tone,
    )
    result = call_llm_json(JD_SYSTEM, user_prompt, JdContentOutput)
    return result.model_dump()


def refine_jd(current_jd: Dict[str, Any], instruction: str) -> Dict[str, Any]:
    """按指令重写 JD 的「内容字段」，结构化元数据字段原样保留（不传入亦不输出）。"""
    content = {
        k: current_jd.get(k)
        for k in ("oneSentencePitch", "responsibilities", "requirements", "preferredSkills")
    }
    current_json = json.dumps(content, ensure_ascii=False, indent=2)
    user_prompt = f"""# 当前 JD 的内容字段（JSON）
{current_json}

# 修改指令
{instruction}

请基于上述指令重写 JD 的内容部分，返回仅含 4 个内容字段（oneSentencePitch/responsibilities/requirements/preferredSkills）的 JSON。"""
    result = call_llm_json(JD_REFINE_SYSTEM, user_prompt, JdContentOutput)
    return result.model_dump()


def _build_screening_user_prompt(
    *,
    resume_text: str,
    target_jd: Optional[str],
    candidate_name: Optional[str],
    target_role: Optional[str],
    experience_years: Optional[int],
) -> str:
    parts: List[str] = []
    parts.append(f"# 候选人姓名：{candidate_name or '未知'}")
    parts.append(f"# 应聘职位：{target_role or '未知'}")
    parts.append(f"# 相关工作年限：{experience_years if experience_years is not None else '请依据简历推断'}")
    if target_jd:
        parts.append(f"\n# 目标职位描述（JD）\n{target_jd}")
    parts.append(f"\n# 候选人简历正文\n{resume_text}")
    parts.append(
        "\n请基于以上信息，按 system 规定的 JSON 结构与键名输出真实评估结果。"
    )
    return "\n".join(parts)


def generate_screening(
    *,
    candidate_name: Optional[str] = None,
    target_role: Optional[str] = None,
    experience_years: Optional[int] = None,
    resume_text: str = "",
    target_jd: Optional[str] = None,
) -> Dict[str, Any]:
    user_prompt = _build_screening_user_prompt(
        resume_text=resume_text,
        target_jd=target_jd,
        candidate_name=candidate_name,
        target_role=target_role,
        experience_years=experience_years,
    )
    result = call_llm_json(SCREENING_SYSTEM, user_prompt, ScreeningOutput)
    return result.model_dump()
