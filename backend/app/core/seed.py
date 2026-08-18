"""首次建库时灌入的示例数据（库为空才写入），用于还原原前端首屏有演示数据的体验。"""
from __future__ import annotations

from sqlalchemy.orm import Session

from app.models import evaluation as evaluation_model
from app.models import jd as jd_model

SEED_JDS = [
    {
        "id": "jd-001",
        "title": "资深全栈开发工程师 (TypeScript / Node / Cloud)",
        "department": "核心研发中心 · 云原生平台组",
        "level": "资深工程师 (P6-P7)",
        "salary_range": "30k-45k · 15薪 + 期权",
        "experience": "5-8年",
        "education": "统招本科及以上 · 计算机相关专业",
        "location": "北京 / 上海 (核心职场，支持混合办公)",
        "work_mode": "混合办公 (每周可居家2天)",
        "one_sentence_pitch": "主导千万级企业服务中台架构演进，直接参与AI Agent与微前端创新工程落地。",
        "responsibilities": [
            "负责企业级数字化中台及AI协同工作台的前后端整体架构设计与高质量代码实现",
            "主导核心模块性能调优、高并发高可用保障及CI/CD自动化研发效能提升",
            "与产品经理、AI算法工程师紧密配合，实现大语言模型（LLM）API的高效接入与工程化落地",
        ],
        "requirements": [
            "计算机科学或相关专业本科以上学历，具备5年以上中大型互联网或企业级SaaS研发经验",
            "精通 TypeScript、React 18+ 生态及现代前端工程化方案（Vite / Webpack / Micro-frontend）",
            "熟练掌握 Node.js / Go 后端开发，深入理解 HTTP/2、RESTful 及 WebSocket 协议",
        ],
        "preferred_skills": [
            "有开源项目贡献经验或在 GitHub 有高质量技术成果者优先",
            "熟悉 Docker/K8s 容器化技术或具备 LLM Agent 实际业务落地经验者优先",
        ],
        "benefits": [
            "全额缴纳六险一金（公积金最高比例12%），年度高端定制体检",
            "全套顶配生产力工具（M3 Max MacBook Pro + 4K双屏）",
        ],
        "created_at": "2026-08-10 14:30",
        "updated_at": "2026-08-15 09:20",
        "creator_name": "admin",
        "status": "PUBLISHED",
        "candidate_count": 14,
        "version": 2,
    },
    {
        "id": "jd-002",
        "title": "AI产品专家 / Agent产品负责人",
        "department": "智能创新实验室",
        "level": "专家级 (P7-P8)",
        "salary_range": "40k-65k · 16薪",
        "experience": "5-10年",
        "education": "重点本科及以上",
        "location": "上海 / 深圳",
        "work_mode": "全职现场",
        "one_sentence_pitch": "定义下一代自主智能体（AI Agent）在企业垂直业务场景中的落地标准与产品闭环。",
        "responsibilities": [
            "负责企业级 AI Agent 产品矩阵的规划、设计与全生命周期管理，明确产品愿景与演进路线",
            "深入垂直行业客户业务场景，提炼高价值痛点，协同算法团队探索最佳模型工程化方案",
            "主导产品PRD撰写、交互设计、Prompt评估体系与模型评测指标定义",
        ],
        "requirements": [
            "5年以上互联网或企业软件产品经验，至少2年以上大模型、AI Native或智能对话产品实操经验",
            "深刻理解主流大语言模型原理、上下文窗口、Function Calling 及 RAG 知识库检索体系",
            "具备敏锐的商业嗅觉与优秀的跨部门沟通推动能力，能精准将前沿技术转化为商业价值",
        ],
        "preferred_skills": [
            "有从0到1主导过千万级流水或百万级日活AI产品经验者优先",
            "具备海外AI产品调研视野或计算机/人机交互复合背景优先",
        ],
        "benefits": [
            "极具竞争力的现金薪酬与高潜力期权激励",
            "直接与行业顶尖AI科学家及工程团队协作",
        ],
        "created_at": "2026-08-12 11:00",
        "updated_at": "2026-08-16 16:45",
        "creator_name": "admin",
        "status": "PUBLISHED",
        "candidate_count": 8,
        "version": 1,
    },
]

SEED_EVALUATIONS = [
    {
        "id": "eval-001",
        "candidate_name": "张明哲 (Eric Zhang)",
        "applied_role": "资深全栈开发工程师 (TypeScript / Node / Cloud)",
        "target_jd_id": "jd-001",
        "target_jd_title": "资深全栈开发工程师",
        "experience_years": 6,
        "education": "浙江大学 · 计算机科学与技术 (统招本科)",
        "current_company": "某头部电商科技集团 (纳斯达克上市)",
        "current_role": "技术中台组 资深全栈研发 (P7)",
        "overall_score": 92,
        "match_level": "EXCELLENT",
        "recommendation": "强烈推荐",
        "dimension_scores": {
            "hardSkills": 94,
            "experienceMatch": 92,
            "stabilityGrowth": 88,
            "compensationFit": 90,
            "softSkills": 93,
        },
        "summary": "技术功底非常扎实，具备亿级流量高并发架构实操与微前端改造成功案例；兼具Node后端与现代React工程能力，近期有自主探索LLM Agent集成的技术产出，综合匹配度极高。",
        "key_highlights": [
            "主导原公司核心交易结算中台重构，将峰值QPS承载能力由8,000提升至35,000，故障率下降75%",
            "主推团队TypeScript代码覆盖率提升至98%，沉淀前端低代码物料库，使新页面开发周期缩短40%",
        ],
        "potential_risks": [
            "目前薪资基数较高（年包约58W），需HR在薪酬谈包阶段确认其对期权激励的接受度",
        ],
        "recommended_questions": [
            {
                "category": "高并发系统实战与容灾",
                "question": "在结算中台QPS提升到3.5W的重构过程中，你遇到了最棘手的分布式锁冲突或数据一致性问题是什么？最终如何设计的降级策略？",
                "reason": "核实其在分布式与高并发场景中的真实技术深度和边界处理方案",
            },
        ],
        "screening_date": "2026-08-16 15:40",
        "status": "INVITED",
        "evaluator_name": "智聘AI 智能评估引擎",
    },
    {
        "id": "eval-002",
        "candidate_name": "陈思羽 (Chloe Chen)",
        "applied_role": "AI产品专家 / Agent产品负责人",
        "target_jd_id": "jd-002",
        "target_jd_title": "AI产品专家",
        "experience_years": 7,
        "education": "上海交通大学 · 软件工程 本硕连读",
        "current_company": "某一线AI原生创新科技公司",
        "current_role": "核心大模型应用产品线 负责人",
        "overall_score": 89,
        "match_level": "GOOD",
        "recommendation": "强烈推荐",
        "dimension_scores": {
            "hardSkills": 91,
            "experienceMatch": 93,
            "stabilityGrowth": 84,
            "compensationFit": 85,
            "softSkills": 90,
        },
        "summary": "难得的兼具深厚算法工程认知与商业化落地的AI产品专家，拥有完整从0到1打造企业级知识库RAG与多Agent协同系统的成功交付经验，逻辑严密，表达清晰。",
        "key_highlights": [
            "从0搭建针对金融咨询行业的Enterprise Agent产品，上线6个月实现ARR 1200万，留存率超85%",
            "建立了一套基于业务反馈的Prompt评测与动态RAG召回优化机制，将幻觉率降低至2.3%",
        ],
        "potential_risks": [
            "近4年经历2家创业公司，需重点了解其对成熟企业流程化推进的适应性及稳定性考量",
        ],
        "recommended_questions": [
            {
                "category": "Agent评测与质量闭环",
                "question": "在企业知识库RAG落地中，面对复杂多表格和非结构化PDF，你们具体采用了怎样的召回与重排序（Rerank）策略？如何量化评估回答质量？",
                "reason": "深度考察其对当前大模型前沿应用痛点的理解与实际产品设计解法",
            },
        ],
        "screening_date": "2026-08-16 11:20",
        "status": "INTERVIEWING",
        "evaluator_name": "智聘AI 智能评估引擎",
    },
]


def seed_if_empty(db: Session) -> None:
    """若两张表都为空，则灌入示例数据（仅首次建库时触发）。

    注意：数据库已被手动清空（仅保留 admin 登录所需，而 admin 登录完全由
    前端硬编码 + localStorage 实现，后端库内无任何 admin 凭据），因此此处
    改为空操作，避免后端重启时又把演示数据灌回来。SEED_JDS / SEED_EVALUATIONS
    常量仍保留，如需恢复首屏演示数据，删除下面的 `return` 即可。
    """
    return  # 数据库已清空且 admin 登录不依赖库内数据，跳过自动灌数据
    if db.query(jd_model.JobDescription).first() or db.query(
        evaluation_model.CandidateEvaluation
    ).first():
        return
    for jd in SEED_JDS:
        db.add(jd_model.JobDescription(**jd))
    for ev in SEED_EVALUATIONS:
        db.add(evaluation_model.CandidateEvaluation(**ev))
    db.commit()
