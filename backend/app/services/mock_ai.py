"""纯 Mock AI 生成逻辑（从 frontend/server.ts 原样移植，isAiLive 恒为 false）。"""
from __future__ import annotations

import random


def generate_screening(
    candidate_name: str | None = None,
    target_role: str | None = None,
    experience_years: int | None = None,
    resume_text: str = "",
    target_jd: str | None = None,
) -> dict:
    """生成简历初筛评估结果（camelCase，对齐前端 CandidateEvaluation）。"""
    calc = random.randint(0, 14) + 82  # 82-96
    role = target_role or "资深业务专家"
    return {
        "candidateName": candidate_name or "候选人",
        "appliedRole": role,
        "experienceYears": experience_years or 5,
        "education": "本科 · 重点大学",
        "currentCompany": "知名互联网科技公司",
        "currentRole": role,
        "overallScore": calc,
        "matchLevel": "EXCELLENT" if calc >= 90 else ("GOOD" if calc >= 80 else "AVERAGE"),
        "recommendation": "强烈推荐" if calc >= 90 else "建议初试",
        "dimensionScores": {
            "hardSkills": calc + random.randint(-2, 2),
            "experienceMatch": calc + random.randint(-3, 3),
            "stabilityGrowth": min(95, calc + 2),
            "compensationFit": 88,
            "softSkills": calc - 1,
        },
        "summary": (
            f"候选人具备扎实的{role}专业基础与实战交付经验，"
            "项目经历中量化产出清晰，技术栈与我司当前招聘需求高度契合。"
        ),
        "keyHighlights": [
            f"深耕{role}核心业务模块，具备端到端系统设计与优化经验",
            "过往项目指标提升显著，具备敏锐的业务洞察力与执行力",
            "具备跨部门协同与推动复杂业务落地的沟通能力",
        ],
        "potentialRisks": [
            "过往经历中关于大规模团队跨国/跨区协同案例较少，需在二面中进一步沟通",
            "期望薪酬区间与目前HC预算上限接近，需HR沟通时把控预期",
        ],
        "recommendedQuestions": [
            {
                "category": "核心专业能力",
                "question": f"请详细阐述在以往项目中，你遇到过最复杂的{role}技术难题是什么？最终通过什么方案解决？",
                "reason": "考察候选人的底层技术深度、分析问题逻辑及独立攻坚能力",
            },
            {
                "category": "业务量化产出",
                "question": "在简历中提到的核心项目重构中，关键业务指标提升的归因逻辑是什么？",
                "reason": "核实项目真实贡献度，排除团队光环导致的简历虚高",
            },
            {
                "category": "职业规划与离职动机",
                "question": "为什么考虑在此阶段转换赛道？你对加入我们团队后半年的期望成果是什么？",
                "reason": "评估入职意愿度、稳定性以及能否快速融入组织文化",
            },
        ],
    }


def generate_jd(
    job_title: str,
    department: str | None = None,
    seniority: str | None = None,
    experience_level: str | None = None,
    education_level: str | None = None,
    salary_range: str | None = None,
    key_skills: str | None = None,
    core_duties_input: str | None = None,
    work_mode: str | None = None,
    location: str | None = None,
    benefits: list[str] | None = None,
    tone: str | None = None,
) -> dict:
    """生成 JD 的「内容字段」（结构化元数据由 HR 提供，mock 只生成内容）。

    返回结构对齐 llm.generate_jd：仅含 oneSentencePitch/responsibilities/
    requirements/preferredSkills 四个字段。
    """
    return {
        "oneSentencePitch": f"主导{job_title}核心业务架构与性能突破，享有广阔的技术决策权与成长通道。",
        "responsibilities": [
            f"负责{job_title}相关核心业务模块的架构设计、代码开发与质量保障",
            "主导关键技术难题攻坚与系统瓶颈优化，保障高可用、高扩展与极致性能",
            "与产品经理、数据分析师及设计团队紧密协同，推进端到端业务快速迭代",
            "参与团队技术规范沉淀、代码审查（Code Review）与初中级成员的技术指导",
        ],
        "requirements": [
            f"计算机或相关理工科专业本科及以上学历，具有{experience_level or '3年及以上'}相关研发与落地实战经验",
            f"熟练掌握{key_skills or '主流开发语言及核心框架'}，具备扎实的计算机底层与架构设计功底",
            "具备良好的工程素养，熟悉CI/CD流水线、微服务架构及自动化测试",
            "具备出色的问题分析与解决能力，有强烈的责任感与自驱力，崇尚简洁优雅的代码",
        ],
        "preferredSkills": [
            "有中大型高并发、分布式系统架构实战落地或大型业务重构经验者优先",
            "在GitHub有高质量活跃开源项目或技术博客撰写习惯者优先",
        ],
    }


def refine_jd(current_jd: dict, instruction: str) -> dict:
    """按指令局部微调 JD 的内容字段（结构化元数据由 HR 维护，不参与微调）。"""
    updated = {k: current_jd.get(k) for k in ("oneSentencePitch", "responsibilities", "requirements", "preferredSkills")}
    instr = instruction or ""
    if ("英文" in instr) or ("外企" in instr):
        reqs = list(updated.get("requirements", []))
        reqs.append("具备流畅的英语听说读写能力，可作为工作语言进行跨国团队协作")
        updated["requirements"] = reqs
    elif ("AI" in instr) or ("大模型" in instr):
        prefs = list(updated.get("preferredSkills", []))
        prefs.append("熟悉主流大语言模型（LLM）API调用、Prompt工程及Agent构建实践者优先")
        updated["preferredSkills"] = prefs
    return updated
