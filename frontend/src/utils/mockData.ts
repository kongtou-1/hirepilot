import { CandidateEvaluation, JobDescription, UserProfile } from '../types';

export const INITIAL_USER: UserProfile = {
  id: 'admin',
  name: 'admin',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
  roleTitle: '',
  department: '',
  company: '',
};

export const INITIAL_JDS: JobDescription[] = [
  {
    id: 'jd-001',
    title: '资深全栈开发工程师 (TypeScript / Node / Cloud)',
    department: '核心研发中心 · 云原生平台组',
    level: '资深工程师 (P6-P7)',
    salaryRange: '30k-45k · 15薪 + 期权',
    experience: '5-8年',
    education: '统招本科及以上 · 计算机相关专业',
    location: '北京 / 上海 (核心职场，支持混合办公)',
    workMode: '混合办公 (每周可居家2天)',
    oneSentencePitch: '主导千万级企业服务中台架构演进，直接参与AI Agent与微前端创新工程落地。',
    responsibilities: [
      '负责企业级数字化中台及AI协同工作台的前后端整体架构设计与高质量代码实现',
      '主导核心模块性能调优、高并发高可用保障及CI/CD自动化研发效能提升',
      '与产品经理、AI算法工程师紧密配合，实现大语言模型（LLM）API的高效接入与工程化落地',
      '负责团队技术栈规范化建设，推进单元测试覆盖率与高质量Code Review',
    ],
    requirements: [
      '计算机科学或相关专业本科以上学历，具备5年以上中大型互联网或企业级SaaS研发经验',
      '精通 TypeScript、React 18+ 生态及现代前端工程化方案（Vite / Webpack / Micro-frontend）',
      '熟练掌握 Node.js / Go 后端开发，深入理解 HTTP/2、RESTful 及 WebSocket 协议',
      '具备扎实的数据结构与算法基础，熟悉 PostgreSQL / Redis 调优及分布式缓存设计',
    ],
    preferredSkills: [
      '有开源项目贡献经验或在 GitHub 有高质量技术成果者优先',
      '熟悉 Docker/K8s 容器化技术或具备 LLM Agent 实际业务落地经验者优先',
    ],
    benefits: [
      '全额缴纳六险一金（公积金最高比例12%），年度高端定制体检',
      '全套顶配生产力工具（M3 Max MacBook Pro + 4K双屏）',
      '无限量高品质现磨咖啡、零食下午茶及免费午晚餐补贴',
    ],
    createdAt: '2026-08-10 14:30',
    updatedAt: '2026-08-15 09:20',
    creatorName: 'admin',
    status: 'PUBLISHED',
    candidateCount: 14,
    version: 2,
  },
  {
    id: 'jd-002',
    title: 'AI产品专家 / Agent产品负责人',
    department: '智能创新实验室',
    level: '专家级 (P7-P8)',
    salaryRange: '40k-65k · 16薪',
    experience: '5-10年',
    education: '重点本科及以上',
    location: '上海 / 深圳',
    workMode: '全职现场',
    oneSentencePitch: '定义下一代自主智能体（AI Agent）在企业垂直业务场景中的落地标准与产品闭环。',
    responsibilities: [
      '负责企业级 AI Agent 产品矩阵的规划、设计与全生命周期管理，明确产品愿景与演进路线',
      '深入垂直行业客户业务场景，提炼高价值痛点，协同算法团队探索最佳模型工程化方案',
      '主导产品PRD撰写、交互设计、Prompt评估体系与模型评测指标定义',
      '驱动产品数据指标持续增长，通过灰度测试与定性定量分析实现产品快速迭代',
    ],
    requirements: [
      '5年以上互联网或企业软件产品经验，至少2年以上大模型、AI Native或智能对话产品实操经验',
      '深刻理解主流大语言模型原理、上下文窗口、Function Calling 及 RAG 知识库检索体系',
      '具备敏锐的商业嗅觉与优秀的跨部门沟通推动能力，能精准将前沿技术转化为商业价值',
    ],
    preferredSkills: [
      '有从0到1主导过千万级流水或百万级日活AI产品经验者优先',
      '具备海外AI产品调研视野或计算机/人机交互复合背景优先',
    ],
    benefits: [
      '极具竞争力的现金薪酬与高潜力期权激励',
      '直接与行业顶尖AI科学家及工程团队协作',
      '每年享有20,000元专属个人学习与海外前沿峰会基金',
    ],
    createdAt: '2026-08-12 11:00',
    updatedAt: '2026-08-16 16:45',
    creatorName: 'admin',
    status: 'PUBLISHED',
    candidateCount: 8,
    version: 1,
  },
  {
    id: 'jd-003',
    title: '大客户销售总监 (KA Sales Director)',
    department: '企业商业化中心',
    level: '总监级 (D1/D2)',
    salaryRange: '50k-80k + 丰厚业绩提成',
    experience: '8-12年',
    education: '本科及以上',
    location: '北京 / 广州',
    workMode: '全职现场',
    oneSentencePitch: '带领团队攻坚世界500强及大型国央企数字化转型大单，年业绩过亿空间。',
    responsibilities: [
      '制定并执行华北/华南区域大客户（KA）拓展战略，完成年度团队销售与回款指标',
      '主导大型政企、金融、高端制造等头部客户的商务谈判、招投标及战略合作签约',
      '搭建并赋能高绩效销售团队，优化销售漏斗与线索转化效能',
    ],
    requirements: [
      '8年以上ToB企业级软件/SaaS或AI解决方案销售经验，3年以上团队管理经验',
      '具备深厚的大型企业高管层（CXO）人脉资源与独立签单千万级项目的成功记录',
      '出色的商业洞察力、谈判攻坚力与抗压能力',
    ],
    preferredSkills: [
      '在泛互联网、金融或高端制造领域有成熟合作案例者优先',
    ],
    benefits: [
      '行业天花板级别的阶梯提成方案，上不封顶',
      '专属商务车补与高端商旅差旅标准',
    ],
    createdAt: '2026-08-05 10:15',
    updatedAt: '2026-08-05 10:15',
    creatorName: 'admin',
    status: 'PUBLISHED',
    candidateCount: 5,
    version: 1,
  },
];

export const INITIAL_EVALUATIONS: CandidateEvaluation[] = [
  {
    id: 'eval-001',
    candidateName: '张明哲 (Eric Zhang)',
    appliedRole: '资深全栈开发工程师 (TypeScript / Node / Cloud)',
    targetJdId: 'jd-001',
    targetJdTitle: '资深全栈开发工程师',
    experienceYears: 6,
    education: '浙江大学 · 计算机科学与技术 (统招本科)',
    currentCompany: '某头部电商科技集团 (纳斯达克上市)',
    currentRole: '技术中台组 资深全栈研发 (P7)',
    overallScore: 92,
    matchLevel: 'EXCELLENT',
    recommendation: '强烈推荐',
    dimensionScores: {
      hardSkills: 94,
      experienceMatch: 92,
      stabilityGrowth: 88,
      compensationFit: 90,
      softSkills: 93,
    },
    summary: '技术功底非常扎实，具备亿级流量高并发架构实操与微前端改造成功案例；兼具Node后端与现代React工程能力，近期有自主探索LLM Agent集成的技术产出，综合匹配度极高。',
    keyHighlights: [
      '主导原公司核心交易结算中台重构，将峰值QPS承载能力由8,000提升至35,000，故障率下降75%',
      '主推团队TypeScript代码覆盖率提升至98%，沉淀前端低代码物料库，使新页面开发周期缩短40%',
      '在GitHub维护有2.1k star的开源Node中间件，代码素养优秀，技术热情与学习敏锐度高',
    ],
    potentialRisks: [
      '目前薪资基数较高（年包约58W），需HR在薪酬谈包阶段确认其对期权激励的接受度',
      '前段经历中跨国远程协作较少，若涉及全球化项目需确认英语日常交流能力',
    ],
    recommendedQuestions: [
      {
        category: '高并发系统实战与容灾',
        question: '在结算中台QPS提升到3.5W的重构过程中，你遇到了最棘手的分布式锁冲突或数据一致性问题是什么？最终如何设计的降级策略？',
        reason: '核实其在分布式与高并发场景中的真实技术深度和边界处理方案，排除浅层配置型经验',
      },
      {
        category: '前端工程化与团队规范',
        question: '推动团队从传统工程迁移至严格TypeScript及微前端时，如何解决遗留债务与团队成员的学习阻力？',
        reason: '评估其作为资深核心人员的技术推动力与跨人际协作领导力',
      },
      {
        category: '离职动机与期望空间',
        question: '在目前大厂成熟体系下发展良好，为什么考虑在这个时间点看外部机会？对新团队的期待是什么？',
        reason: '考察候选人真实的职业诉求与组织契合度，为后续Offer谈包做准备',
      },
    ],
    screeningDate: '2026-08-16 15:40',
    status: 'INVITED',
    evaluatorName: 'AI智能招聘引擎 (Gemini 3.7 Pro)',
    rawResumeText: `张明哲 | 男 | 6年经验 | 浙江大学计算机系本科
求职意向：资深全栈工程师 / 架构师
工作经历：
2021.04 - 至今 某头部电商科技集团 · 资深全栈研发
- 负责核心交易中台微服务化改造与前端微前端架构搭建
- 带领4人小组完成结算收银台系统性能压测与架构升级
2019.07 - 2021.03 某知名SaaS独角兽 · 前端开发工程师
- 负责CRM系统核心表单引擎与可视化看板开发`,
  },
  {
    id: 'eval-002',
    candidateName: '陈思羽 (Chloe Chen)',
    appliedRole: 'AI产品专家 / Agent产品负责人',
    targetJdId: 'jd-002',
    targetJdTitle: 'AI产品专家',
    experienceYears: 7,
    education: '上海交通大学 · 软件工程 本硕连读',
    currentCompany: '某一线AI原生创新科技公司',
    currentRole: '核心大模型应用产品线 负责人',
    overallScore: 89,
    matchLevel: 'GOOD',
    recommendation: '强烈推荐',
    dimensionScores: {
      hardSkills: 91,
      experienceMatch: 93,
      stabilityGrowth: 84,
      compensationFit: 85,
      softSkills: 90,
    },
    summary: '难得的兼具深厚算法工程认知与商业化落地的AI产品专家，拥有完整从0到1打造企业级知识库RAG与多Agent协同系统的成功交付经验，逻辑严密，表达清晰。',
    keyHighlights: [
      '从0搭建针对金融咨询行业的Enterprise Agent产品，上线6个月实现ARR 1200万，留存率超85%',
      '建立了一套基于业务反馈的Prompt评测与动态RAG召回优化机制，将幻觉率降低至2.3%',
      '具备出色的技术沟通桥梁能力，能高效与算法博士团队探讨微调（Fine-tuning）及推理成本控制',
    ],
    potentialRisks: [
      '近4年经历2家创业公司，需重点了解其对成熟企业流程化推进的适应性及稳定性考量',
    ],
    recommendedQuestions: [
      {
        category: 'Agent评测与质量闭环',
        question: '在企业知识库RAG落地中，面对复杂多表格和非结构化PDF，你们具体采用了怎样的召回与重排序（Rerank）策略？如何量化评估回答质量？',
        reason: '深度考察其对当前大模型前沿应用痛点的理解与实际产品设计解法',
      },
      {
        category: '商业化与客户预期管理',
        question: '当大模型的非确定性与B端客户对100%准确率的苛求产生冲突时，你通常如何设计产品防线和进行客户引导？',
        reason: '评估其在真实商业化环境下的应变与交付把控能力',
      },
    ],
    screeningDate: '2026-08-16 11:20',
    status: 'INTERVIEWING',
    evaluatorName: 'AI智能招聘引擎 (Gemini 3.7 Pro)',
  },
  {
    id: 'eval-003',
    candidateName: '王浩然 (Victor Wang)',
    appliedRole: '资深全栈开发工程师 (TypeScript / Node / Cloud)',
    targetJdId: 'jd-001',
    targetJdTitle: '资深全栈开发工程师',
    experienceYears: 4,
    education: '华中科技大学 · 软件工程 (本科)',
    currentCompany: '某移动互联网创业团队',
    currentRole: '全栈开发工程师',
    overallScore: 78,
    matchLevel: 'AVERAGE',
    recommendation: '建议初试',
    dimensionScores: {
      hardSkills: 80,
      experienceMatch: 76,
      stabilityGrowth: 86,
      compensationFit: 92,
      softSkills: 78,
    },
    summary: '基本功良好，掌握主流全栈技术栈，学习意愿较强。但过往项目规模主要集中于中小型单体或轻量级微服务，缺乏千万级并发与复杂分布式事务实战经验，更适合作为中级骨干储备。',
    keyHighlights: [
      '对React、Tailwind及Next.js生态运用熟练，交付速度快，具备较好的UI审美与代码规范意识',
      '薪酬预期务实合理，工作态度踏实积极，具有较强的加班攻坚与自学能力',
    ],
    potentialRisks: [
      '缺少大型企业级中台的系统架构设计经验，系统设计深度可能不足以直接承担P7独立架构职责',
      '在数据库调优与复杂高可用方案上的积累相对薄弱',
    ],
    recommendedQuestions: [
      {
        category: '架构深度考察',
        question: '请描述在你的过往项目中，针对数据库慢查询与接口高延迟，你采取过哪些系统性的排查与优化手段？',
        reason: '确认其实际排障能力是否达到资深工程师标准',
      },
    ],
    screeningDate: '2026-08-15 16:10',
    status: 'NEW',
    evaluatorName: 'AI智能招聘引擎 (Gemini 3.7 Pro)',
  },
  {
    id: 'eval-004',
    candidateName: '刘立峰 (Leo Liu)',
    appliedRole: '大客户销售总监 (KA Sales Director)',
    targetJdId: 'jd-003',
    targetJdTitle: '大客户销售总监',
    experienceYears: 10,
    education: '对外经济贸易大学 · 国际贸易 本科',
    currentCompany: '某国际知名企业级软件厂商 (中国区)',
    currentRole: '华北区 销售总监',
    overallScore: 91,
    matchLevel: 'EXCELLENT',
    recommendation: '强烈推荐',
    dimensionScores: {
      hardSkills: 90,
      experienceMatch: 95,
      stabilityGrowth: 92,
      compensationFit: 88,
      softSkills: 94,
    },
    summary: '外企正规军出身，具备扎实的现代销售方法论（MEDDPICC）与高层客户攻坚经验；在央国企及头部金融行业拥有极强的人脉网络，过往3年连续超额完成2000万级年度指标。',
    keyHighlights: [
      '连续3年获评中国区年度Top Sales，单笔最高签约金额达1,800万元（某大型国有银行数字化项目）',
      '擅长打造狼性且规范的KA铁军，团队离职率常年低于8%，人均单产位列部门第一',
      '对AI赋能传统企业业务流程有深刻见解，能快速与客户高管建立信任',
    ],
    potentialRisks: [
      '过往依靠原公司强大的品牌背书较多，需评估其在创业或成长期团队中开辟新客户的自生能力',
    ],
    recommendedQuestions: [
      {
        category: '商业拓展与品牌弱势攻坚',
        question: '如果脱离国际知名品牌光环，面对一家处于高速成长期但知名度尚在建立中的科技品牌，你如何向央国企CXO敲开第一扇门？',
        reason: '评估其真实个人攻坚能力与资源粘性',
      },
    ],
    screeningDate: '2026-08-14 09:30',
    status: 'OFFERED',
    evaluatorName: 'AI智能招聘引擎 (Gemini 3.7 Pro)',
  },
];

export const SAMPLE_RESUMES = [
  {
    name: '李俊杰 - 资深全栈工程师 (8年)',
    role: '资深全栈开发工程师',
    text: `李俊杰 | 男 | 1993年出生 | 统招本科 · 华中科技大学 软件工程 (2016届)
联系方式：138****9281 | 邮箱：junjie.li@sample.com
求职意向：资深全栈工程师 / 前端架构师 / 薪资期望：35k-45k

【专业技能】
1. 深入掌握 TypeScript、JavaScript(ES6+)、React 18、Vue3、Node.js (NestJS / Express) 全栈体系；
2. 熟练掌握微前端（Module Federation / qiankun）、前端性能工程化构建及低代码平台研发；
3. 熟悉 PostgreSQL、MySQL、Redis，掌握常见分布式缓存、消息队列（Kafka/RabbitMQ）与 Docker 容器化编排；
4. 熟练使用 Tailwind CSS、Next.js，有企业级 AI Agent 工作台与 LangChain 业务集成经验。

【工作经历】
■ 2021.06 - 至今 | 某知名云原生企业软件公司 | 资深全栈开发工程师 & 技术组长
- 负责核心低代码与AI协同平台架构研发，主导前后端分离与微前端中台改造，日活支撑 50,000+ 企事业单位员工；
- 推进核心页面首屏加载时间从 3.8s 降低至 0.9s，通过虚拟列表与 Web Worker 计算使十万级数据表格渲染无卡顿；
- 带领 5 人全栈研发小组，规范代码评审（CR）机制，引入单元测试（Jest/Playwright），故障率同比下降 45%；
- 主导接入大模型助手功能，实现自然语言生成流程图与低代码表单，提升终端用户搭建效率 60%。

■ 2018.04 - 2021.05 | 某互联网独角兽科技有限公司 | 前端高级工程师
- 主导营销活动中台系统研发，支持 618 / 双11 亿级流量高并发大促，实现零重大事故平稳运行；
- 封装跨端通用 UI 基础库，在全公司 12 个业务线落地，累计复用组件超过 200+ 个。

■ 2016.07 - 2018.03 | 某科技初创公司 | 前端开发工程师
- 负责电商及后台管理系统的基础功能开发与维护。`,
  },
  {
    name: '周雅涵 - AI产品专家 / 算法产品经理 (5年)',
    role: 'AI产品专家',
    text: `周雅涵 | 女 | 1996年出生 | 硕士 · 复旦大学 计算机应用技术 | 本科 · 同济大学 软件工程
联系方式：139****1827 | 邮箱：yahan.zhou@sample.com
求职意向：AI产品专家 / Agent产品负责人 / 薪资期望：45k-55k

【核心优势】
- 5年AI与数据智能产品经验，拥有从0到1负责千万级企业Agent工作流与知识库产品的全周期操盘经历；
- 具备扎实的技术背景，能与大模型算法团队无缝交流 Transformer、LoRA微调、RAG 向量检索原理；
- 强数据分析与商业敏锐度，主导的产品累计创造超过 3000 万元商业化收入。

【工作经历】
■ 2022.03 - 至今 | 某头部大模型创新企业 | Senior AI Product Manager
- 负责企业级智能知识库与多智能体（Multi-Agent）协同平台规划，梳理 100+ 真实企业业务场景；
- 设计混合检索（Dense + Sparse Vector）与动态上下文压缩流程，使客户问答准确率由 76% 跃升至 94.5%；
- 主导产品计费模型与开放平台 API 规范，推动 80+ 标杆政企客户签约落地，达成年度 1800万 ARR 目标；
- 制定 Agent 评测基准套件（涵盖幻觉率、意图识别召回率、推理执行耗时），构建持续自迭代飞轮。

■ 2019.07 - 2022.02 | 某一线互联网大厂 · 搜索与推荐事业部 | 产品经理
- 负责知识图谱与智能问答中台的产品设计，对接电商智能客服与内容审核业务，承接日均千万级调用。`,
  },
  {
    name: '赵天成 - 资深HRBP / 招聘专家 (6年)',
    role: '招聘专家 / HRBP',
    text: `赵天成 | 男 | 1994年出生 | 统招本科 · 中国人民大学 人力资源管理 (2016届)
联系方式：137****5520 | 邮箱：tc.zhao@sample.com
求职意向：招聘总监 / 资深HRBP / 薪资期望：28k-38k

【专业能力】
- 熟悉现代互联网与高科技企业端到端招聘体系，擅长猎头BD、人才地图（Talent Mapping）搭建与被动候选人攻坚；
- 具备出色的雇主品牌建设与招聘流程数字化能力，推行过ATS系统与AI初筛机制；
- 具有深厚的业务理解力，曾支持技术研发、商业化及战略新兴业务部。

【工作经历】
■ 2021.08 - 至今 | 某知名高科技独角兽 | 研发线招聘负责人
- 负责 600+ 人规模研发团队的招聘交付，年均招聘中高端工程师、架构师及算法专家 120+ 人，Offer接受率达 88%；
- 优化简历筛选与面试闭环流程，候选人端到端交付周期（Time to Hire）从 38 天压缩至 21 天；
- 搭建行业顶尖人才储备库（Talent Pool），关键核心岗位储备覆盖率达到 150%。`,
  },
];
