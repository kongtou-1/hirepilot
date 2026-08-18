import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Briefcase,
  Copy,
  Check,
  Save,
  Send,
  Wand2,
  Building,
  DollarSign,
  Clock,
  GraduationCap,
  MapPin,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { JobDescription } from '../types';

interface JdGenerationAgentProps {
  onSaveJd: (jd: JobDescription) => void;
  onUseJdForScreening: (jdId: string) => void;
  onViewJdHistory: () => void;
  initialJd?: JobDescription | null;
}

export const JdGenerationAgent: React.FC<JdGenerationAgentProps> = ({
  onSaveJd,
  onUseJdForScreening,
  onViewJdHistory,
  initialJd,
}) => {
  // Input fields (default empty; presets can be applied via the template chips if needed)
  const [jobTitle, setJobTitle] = useState(initialJd?.title || '');
  const [jobTitleError, setJobTitleError] = useState(false);
  const [department, setDepartment] = useState(initialJd?.department || '');
  const [seniority, setSeniority] = useState(initialJd?.level || '');
  const [salaryRange, setSalaryRange] = useState(initialJd?.salaryRange || '');
  const [experienceLevel, setExperienceLevel] = useState(initialJd?.experience || '');
  const [educationLevel, setEducationLevel] = useState(initialJd?.education || '');
  const [workMode, setWorkMode] = useState(initialJd?.workMode || '');
  const [location, setLocation] = useState(initialJd?.location || '');
  const [benefits, setBenefits] = useState<string[]>(
    initialJd?.benefits && initialJd.benefits.length
      ? [...initialJd.benefits]
      : ['', '', '']
  );
  const [keySkills, setKeySkills] = useState('');
  const [coreDutiesInput, setCoreDutiesInput] = useState('');
  const [tone, setTone] = useState('务实专业');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedJd, setGeneratedJd] = useState<JobDescription | null>(initialJd || null);
  const [copied, setCopied] = useState(false);

  // 生成按钮 5 秒冷却
  const [jdCooldown, setJdCooldown] = useState<number>(0);
  const jdCooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (jdCooldownTimer.current) clearInterval(jdCooldownTimer.current);
    };
  }, []);

  const startJdCooldown = () => {
    if (jdCooldownTimer.current) clearInterval(jdCooldownTimer.current);
    let remaining = 5;
    setJdCooldown(remaining);
    jdCooldownTimer.current = setInterval(() => {
      remaining -= 1;
      setJdCooldown(remaining);
      if (remaining <= 0 && jdCooldownTimer.current) {
        clearInterval(jdCooldownTimer.current);
        jdCooldownTimer.current = null;
      }
    }, 1000);
  };
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [customRefinePrompt, setCustomRefinePrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  // Preset templates
  const presets = [
    {
      label: 'AI 架构师 / Agent 专家',
      title: '资深 AI 平台架构师 (LLM / Agent Engine)',
      dept: 'AI 创新工程院',
      level: '资深专家 (P7/P8)',
      salary: '45k-65k · 16薪',
      skills: 'Python, TypeScript, LangChain/LlamaIndex, vLLM/Ollama, 分布式推理加速, K8s',
      duties: '负责企业级多智能体协同引擎与工作流编排系统的核心架构设计与工程化交付',
    },
    {
      label: '全栈开发工程师 (Web & Cloud)',
      title: '资深全栈开发工程师 (React / Node / Cloud)',
      dept: '数字产品中台组',
      level: '资深工程师 (P6/P7)',
      salary: '30k-45k · 14薪',
      skills: 'TypeScript, React 19, Node.js/Express, Tailwind CSS, PostgreSQL, Redis',
      duties: '主导千万级企业 SaaS 平台的端到端架构研发，攻坚高可用与极速首屏加载性能',
    },
    {
      label: 'AI 原生产品专家',
      title: 'AI 智能体产品专家 / 业务负责人',
      dept: '智能商业事业群',
      level: '高级产品专家 (P7)',
      salary: '35k-55k · 15薪',
      skills: '大模型应用设计, Prompt 调优, RAG 检索体系, B端商业化, 数据驱动指标',
      duties: '从0到1定义垂直行业 AI Agent 产品矩阵，打造高壁垒高留存的企业级应用闭环',
    },
    {
      label: '大客户销售总监 (KA Sales)',
      title: '大客户商业化销售总监 (Enterprise KA)',
      dept: '全球商务拓展中心',
      level: '总监级 (D1)',
      salary: '50k-80k + 丰厚业绩提成',
      skills: 'ToB 大客户销售方法论, 500强及政企客户网络, 商务谈判, 团队管理',
      duties: '开拓大型金融、制造及跨国企业数字化转型大单，主导千万级战略采购招投标',
    },
  ];

  const handleApplyPreset = (p: (typeof presets)[0]) => {
    setJobTitle(p.title);
    setDepartment(p.dept);
    setSeniority(p.level);
    setSalaryRange(p.salary);
    setKeySkills(p.skills);
    setCoreDutiesInput(p.duties);
  };

  const handleResetForm = () => {
    setJobTitle('');
    setJobTitleError(false);
    setDepartment('');
    setSeniority('');
    setSalaryRange('');
    setExperienceLevel('');
    setEducationLevel('');
    setWorkMode('');
    setLocation('');
    setBenefits(['', '', '']);
    setKeySkills('');
    setCoreDutiesInput('');
    setTone('务实专业');
    setGeneratedJd(null);
    setSavedSuccess(false);
    setCopied(false);
    setCustomRefinePrompt('');
  };

  const handleGenerate = async () => {
    if (!jobTitle.trim()) {
      setJobTitleError(true);
      return;
    }
    setJobTitleError(false);

    setIsGenerating(true);
    setSavedSuccess(false);

    try {
      const res = await fetch('/api/jd/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle,
          department,
          seniority,
          experienceLevel,
          educationLevel,
          salaryRange,
          location,
          workMode,
          benefits: benefits.map((b) => b.trim()).filter(Boolean),
          keySkills,
          coreDutiesInput,
          tone,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const raw = json.data;
        // 9 个结构化字段一律取 HR 表单输入（大模型不参与），仅内容字段来自大模型
        const newJd: JobDescription = {
          id: 'jd-' + Date.now(),
          title: jobTitle,
          department,
          level: seniority,
          salaryRange,
          experience: experienceLevel,
          education: educationLevel,
          location,
          workMode,
          benefits: benefits.map((b) => b.trim()).filter(Boolean),
          oneSentencePitch: raw.oneSentencePitch || `主导${jobTitle}核心技术破局与业务落地。`,
          responsibilities: raw.responsibilities || [
            `负责${jobTitle}核心业务模块的架构设计与持续优化`,
            '攻坚关键技术瓶颈，提升系统吞吐与高可用性',
            '与跨职能团队紧密协作，快速交付高价值业务成果',
          ],
          requirements: raw.requirements || [
            `统招本科以上学历，具备${experienceLevel}相关工作经验`,
            `扎实掌握${keySkills}，具备独立解决复杂工程问题的能力`,
            '具有出色的沟通协作与自驱动力，崇尚严谨的代码规范',
          ],
          preferredSkills: raw.preferredSkills || [
            '有高并发分布式系统实战落地经验或开源项目贡献者优先',
          ],
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          creatorName: 'AI 智能招聘引擎',
          status: 'PUBLISHED',
          candidateCount: 0,
          version: 1,
        };

        setGeneratedJd(newJd);
        onSaveJd(newJd);
        setSavedSuccess(true);
        startJdCooldown();
      } else {
        throw new Error(json.error || '生成失败');
      }
    } catch (err: any) {
      console.error(err);
      alert('JD 生成异常：' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!generatedJd) return;
    setIsRefining(true);

    try {
      const res = await fetch('/api/jd/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentJd: generatedJd,
          instruction,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const updatedJd: JobDescription = {
          ...generatedJd,
          ...json.data,
          updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          version: (generatedJd.version || 1) + 1,
        };
        setGeneratedJd(updatedJd);
        onSaveJd(updatedJd);
        setSavedSuccess(true);
        setCustomRefinePrompt('');
      }
    } catch (err: any) {
      alert('微调失败: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const formatJdAsMarkdown = (jd: JobDescription): string => {
    return `# 【招聘】${jd.title}
**所属部门**：${jd.department} | **职级定位**：${jd.level} | **薪资待遇**：${jd.salaryRange}
**工作地点与形式**：${jd.location} (${jd.workMode})
**学历要求**：${jd.education} | **经验要求**：${jd.experience}

---
### 💡 核心吸引力
${jd.oneSentencePitch}

### 📌 岗位职责
${jd.responsibilities.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### 🎯 任职资格
${jd.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

### 🌟 优先加分项
${jd.preferredSkills.map((p, i) => `• ${p}`).join('\n')}

### 🎁 薪酬福利与成长
${jd.benefits.map((b) => `✓ ${b}`).join('\n')}
`;
  };

  const handleCopyJd = () => {
    if (!generatedJd) return;
    const text = formatJdAsMarkdown(generatedJd);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Main Grid: Left Configuration & Right Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Inputs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">1. 岗位参数与招聘需求</h2>
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition cursor-pointer"
                title="清空表单"
              >
                <RefreshCw className="w-3 h-3" />
                <span>重置清空</span>
              </button>
            </div>

            {/* Job Title & Department */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  职位名称 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => {
                    setJobTitle(e.target.value);
                    if (jobTitleError) setJobTitleError(false);
                  }}
                  placeholder="如：资深前端架构师"
                  className={`w-full rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 transition ${
                    jobTitleError
                      ? 'bg-rose-50 border border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                      : 'bg-slate-50 border border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                  }`}
                />
                {jobTitleError && (
                  <p className="mt-1 text-[11px] text-rose-600 font-medium">
                    职位名称为必填项，请填写后再生成
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">所属部门</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="如：技术研发中心"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Level & Salary */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">职级层级</label>
                <input
                  type="text"
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
                  placeholder="如：资深/专家 (P7)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">薪酬区间</label>
                <input
                  type="text"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  placeholder="如：30k-45k · 15薪"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Experience & Education */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">工作年限要求</label>
                <input
                  type="text"
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  placeholder="如：3-5年"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">最低学历要求</label>
                <input
                  type="text"
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  placeholder="如：本科及以上"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">工作地点</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="如：北京 / 上海 / 远程"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Key Skills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">核心技术栈 / 专业技能词</label>
              <textarea
                rows={2}
                value={keySkills}
                onChange={(e) => setKeySkills(e.target.value)}
                placeholder="如：TypeScript, React, Python, 微服务, 性能调优..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Duties & Directives */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">核心业务场景 / HR 重点诉求</label>
              <textarea
                rows={2}
                value={coreDutiesInput}
                onChange={(e) => setCoreDutiesInput(e.target.value)}
                placeholder="说明该岗位面临的业务挑战、关键交付目标..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            {/* Benefits (HR 手写，3 条) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">薪酬福利</label>
              <div className="space-y-2">
                {[0, 1, 2].map((idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={benefits[idx] || ''}
                    onChange={(e) => {
                      const next = [...benefits];
                      next[idx] = e.target.value;
                      setBenefits(next);
                    }}
                    placeholder={`福利 ${idx + 1}，如：六险一金 + 年度高端体检`}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                ))}
              </div>
            </div>

            {/* Tone selector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">工作形式</label>
                <input
                  type="text"
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value)}
                  placeholder="如：混合办公 / 全职"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">文风基调</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="务实专业">务实干练 (一线大厂风格)</option>
                  <option value="极客极简">极客创新 (技术吸引力)</option>
                  <option value="国际化跨国">国际化跨国 (强调视野)</option>
                  <option value="高管商业">商业领袖 (强调业绩指标)</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              disabled={isGenerating || jdCooldown > 0}
              onClick={handleGenerate}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs tracking-wide shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>AI 正在结构化生成专业 JD...</span>
                </>
              ) : jdCooldown > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  <span>请稍候 {jdCooldown}s 后可再次生成</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>生成专业企业级职位描述 (JD)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Structured JD Preview & Refinement (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {generatedJd ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* JD Card Presentation */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-slate-900">{generatedJd.title}</h2>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {generatedJd.level}
                      </span>
                      {savedSuccess && (
                        <span className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" /> 已保存至历史库
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 flex-wrap">
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        💰 {generatedJd.salaryRange}
                      </span>
                      <span>🏢 {generatedJd.department}</span>
                      <span>📍 {generatedJd.location}</span>
                      <span>🎓 {generatedJd.education}</span>
                      <span>⏱ {generatedJd.experience}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 shrink-0 text-right">
                    <div>版本：v{generatedJd.version || 1}</div>
                    <div className="text-[10px] mt-0.5">{generatedJd.updatedAt}</div>
                  </div>
                </div>

                {/* One sentence pitch */}
                <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-xl">
                  <div className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                    💡 岗位核心吸引力 (One-Sentence Pitch)
                  </div>
                  <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                    {generatedJd.oneSentencePitch}
                  </p>
                </div>

                {/* Responsibilities */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>岗位职责 (Core Responsibilities)</span>
                  </h3>
                  <div className="space-y-2">
                    {generatedJd.responsibilities.map((r, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                        <span className="leading-snug">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    <span>任职资格与硬性要求 (Key Requirements)</span>
                  </h3>
                  <div className="space-y-2">
                    {generatedJd.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60">
                        <span className="font-bold text-indigo-600 shrink-0">{idx + 1}.</span>
                        <span className="leading-snug">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preferred Skills */}
                {generatedJd.preferredSkills && generatedJd.preferredSkills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>加分项 (Preferred Qualifications)</span>
                    </h3>
                    <div className="space-y-1.5">
                      {generatedJd.preferredSkills.map((p, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                          <span className="text-emerald-600 font-bold shrink-0">★</span>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Benefits */}
                {generatedJd.benefits && generatedJd.benefits.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-600" />
                      <span>团队福利与成长通道 (Benefits & Perks)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {generatedJd.benefits.map((b, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                          <span className="text-amber-600 shrink-0">✓</span>
                          <span className="truncate">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Bottom Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-slate-400">
                    可直接发布至招聘平台或用于内部评审
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyJd}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{copied ? '已复制 Markdown' : '复制全文'}</span>
                    </button>

                    <button
                      onClick={() => onUseJdForScreening(generatedJd.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>以此 JD 启动简历初筛</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Interactive AI Refinement Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>智能快速微调 (Quick AI Refinements)</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">一键修正特定诉求</span>
                </div>

                {/* Preset refinement chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    '增加对大语言模型 (LLM) 与 Agent 实操加分项',
                    '增加全英文作为跨国协作工作语言要求',
                    '强调千万级高并发分布式实战与性能调优',
                    '改写为 100% Remote 远程办公形式',
                    '强化团队管理与跨部门沟通领导力要求',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      disabled={isRefining}
                      onClick={() => handleRefine(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-slate-700 transition cursor-pointer disabled:opacity-50"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>

                {/* Custom Instruction Input */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    value={customRefinePrompt}
                    onChange={(e) => setCustomRefinePrompt(e.target.value)}
                    placeholder="输入自定义优化指令，如：把学历提高至硕士，并增加对金融交易业务的理解..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customRefinePrompt.trim()) {
                        handleRefine(customRefinePrompt.trim());
                      }
                    }}
                  />
                  <button
                    disabled={isRefining || !customRefinePrompt.trim()}
                    onClick={() => handleRefine(customRefinePrompt.trim())}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isRefining ? '微调中...' : '提交微调'}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center h-full min-h-[460px]">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">等待生成专业 JD</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
                在左侧填写招聘岗位、技能与职责要求，或点击模版快速填充，AI 将为您一键输出结构化、务实高效的职位描述。
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
