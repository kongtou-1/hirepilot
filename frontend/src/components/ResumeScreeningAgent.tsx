import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FileText,
  Sparkles,
  Award,
  AlertTriangle,
  HelpCircle,
  Printer,
  Copy,
  Check,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Briefcase,
  UploadCloud,
  FileUp,
  User,
  ArrowRight,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Layers,
  Zap,
  Info,
  Clock,
  ExternalLink,
  List,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  CandidateEvaluation,
  JobDescription,
  OriginalFileMeta,
  RecommendationType,
  ScreeningTask,
} from '../types';
import { formatEvaluationAsText, printCandidateReport } from '../utils/exportReport';
import { api } from '../utils/api';

interface ResumePoolItem {
  id: string;
  name: string;
  role: string;
  candidateName: string;
  expYears: number;
  education: string;
  company: string;
  text: string;
  originalFile?: OriginalFileMeta;
  targetJdId?: string;
}

interface ResumeScreeningAgentProps {
  jds: JobDescription[];
  evaluations: CandidateEvaluation[];
  onSaveEvaluation: (evaluation: CandidateEvaluation) => void;
  onRefreshEvaluations?: () => Promise<void>;
  onViewHistory: () => void;
  initialSelectedJdId?: string;
}

export const ResumeScreeningAgent: React.FC<ResumeScreeningAgentProps> = ({
  jds,
  evaluations,
  onSaveEvaluation,
  onRefreshEvaluations,
  onViewHistory,
  initialSelectedJdId,
}) => {
  // Build resume pool from backend evaluations (only those with raw resume text)
  const poolItems = useMemo<ResumePoolItem[]>(() => {
    return evaluations
      .filter((ev) => ev.rawResumeText?.trim())
      .map((ev) => ({
        id: ev.id,
        name: `${ev.candidateName} - ${ev.appliedRole} (${ev.experienceYears}年)`,
        role: ev.appliedRole,
        candidateName: ev.candidateName,
        expYears: ev.experienceYears,
        education: ev.education,
        company: ev.currentCompany,
        text: ev.rawResumeText || '',
        originalFile: ev.originalFile,
        targetJdId: ev.targetJdId,
      }));
  }, [evaluations]);

  // Input mode: 'existing' (choose pre-existing resume) vs 'upload' (upload file/paste)
  const [resumeSource, setResumeSource] = useState<'existing' | 'upload'>('existing');
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  // Selected JD for alignment
  const [selectedJdId, setSelectedJdId] = useState<string>(
    initialSelectedJdId || (jds[0]?.id ?? '')
  );

  // Resume form fields
  const [candidateName, setCandidateName] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>(jds[0]?.title || '');
  const [experienceYears, setExperienceYears] = useState<number>(0);
  const [resumeText, setResumeText] = useState<string>('');

  // If resume pool is empty, default to upload mode and clear selection
  useEffect(() => {
    if (poolItems.length === 0) {
      setResumeSource('upload');
      setSelectedPoolId(null);
    }
  }, [poolItems]);

  // 简历库滑动窗口：最多显示 5 位候选人，可向上 / 向下滑动
  const poolScrollRef = useRef<HTMLDivElement>(null);
  const POOL_ITEM_STEP = 72; // 64px 卡片高度 + 8px 间距
  const POOL_VISIBLE_COUNT = 3; // 一次最多显示 3 位
  const [poolCanUp, setPoolCanUp] = useState<boolean>(false);
  const [poolCanDown, setPoolCanDown] = useState<boolean>(false);
  const [poolVisibleRange, setPoolVisibleRange] = useState<{ start: number; end: number }>({
    start: 1,
    end: 1,
  });

  const updatePoolScroll = () => {
    const el = poolScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const top = el.scrollTop;
    setPoolCanUp(top > 2);
    setPoolCanDown(top < maxScroll - 2);
    const start = Math.floor(top / POOL_ITEM_STEP) + 1;
    const visible = Math.max(1, Math.round(el.clientHeight / POOL_ITEM_STEP));
    const end = Math.min(poolItems.length, start + visible - 1);
    setPoolVisibleRange({ start: Math.max(1, start), end: Math.max(1, end) });
  };

  const scrollPool = (dir: 1 | -1) => {
    const el = poolScrollRef.current;
    if (!el) return;
    el.scrollBy({ top: dir * POOL_ITEM_STEP, behavior: 'smooth' });
  };

  // 候选人列表或切换标签后重新计算滑动状态
  useEffect(() => {
    const id = window.requestAnimationFrame(updatePoolScroll);
    return () => window.cancelAnimationFrame(id);
  }, [poolItems, resumeSource]);

  // Upload metadata
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = useState<string | null>(null);
  const [extractedFileMeta, setExtractedFileMeta] = useState<OriginalFileMeta | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [autoScoreOnSelect, setAutoScoreOnSelect] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<CandidateEvaluation | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Async task queue state
  const [tasks, setTasks] = useState<ScreeningTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState<boolean>(false);

  // 评估打分按钮 5 秒冷却
  const [scoreCooldown, setScoreCooldown] = useState<number>(0);
  const scoreCooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (scoreCooldownTimer.current) clearInterval(scoreCooldownTimer.current);
    };
  }, []);

  // Load recent tasks on mount
  useEffect(() => {
    refreshTasks();
  }, []);

  // Poll running/pending tasks
  useEffect(() => {
    const hasActive = tasks.some((t) => t.status === 'pending' || t.status === 'running');
    if (!hasActive) return;

    const timer = setInterval(() => {
      pollActiveTasks();
    }, 2000);
    return () => clearInterval(timer);
  }, [tasks]);

  const refreshTasks = async () => {
    setTasksLoading(true);
    try {
      const list = await api.listScreeningTasks();
      setTasks(list);
    } catch (err: any) {
      console.error('刷新任务列表失败', err);
    } finally {
      setTasksLoading(false);
    }
  };

  const pollActiveTasks = async () => {
    const activeIds = tasks
      .filter((t) => t.status === 'pending' || t.status === 'running')
      .map((t) => t.id);
    if (activeIds.length === 0) return;

    const updated = await Promise.all(
      activeIds.map(async (id) => {
        try {
          return await api.getScreeningTask(id);
        } catch (err: any) {
          console.error('轮询任务失败', id, err);
          return null;
        }
      })
    );

    // 合并新旧任务，并检测是否有任务「刚完成」——完成后自动刷新评估库，历史页即可看到新记录
    const map = new Map<string, ScreeningTask>();
    tasks.forEach((t) => map.set(t.id, t));
    let newlyCompleted = false;
    updated.forEach((t) => {
      if (!t) return;
      const before = map.get(t.id);
      map.set(t.id, t);
      if (before && before.status !== 'completed' && t.status === 'completed' && t.evaluationId) {
        newlyCompleted = true;
      }
    });
    setTasks(
      Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    );

    if (newlyCompleted && onRefreshEvaluations) {
      await onRefreshEvaluations();
    }
  };

  const displayTaskResult = async (task: ScreeningTask) => {
    if (!task.evaluationId) return;
    if (onRefreshEvaluations) {
      await onRefreshEvaluations();
    }
    try {
      const evaluation = await api.getEvaluation(task.evaluationId);
      setEvaluationResult(evaluation);
    } catch (err: any) {
      console.error('加载评估结果失败', err);
    }
  };

  // Update targetRole when selected JD changes
  const handleJdChange = (jdId: string) => {
    setSelectedJdId(jdId);
    const found = jds.find((j) => j.id === jdId);
    if (found) {
      setTargetRole(found.title);
      if (autoScoreOnSelect && resumeText.trim()) {
        triggerAnalyzeWithParams(candidateName, found.title, jdId, experienceYears, resumeText);
      }
    }
  };

  // Select an existing candidate from talent pool
  const handleSelectPoolCandidate = (id: string) => {
    setSelectedPoolId(id);
    const item = poolItems.find((p) => p.id === id);
    if (!item) return;

    setCandidateName(item.candidateName);
    setExperienceYears(item.expYears);
    setResumeText(item.text);
    setExtractedFileMeta(item.originalFile ?? null);
    setUploadedFileName(null);

    // Auto-match best JD
    let matchedJd = jds.find((j) => j.id === item.targetJdId);
    if (!matchedJd && jds.length > 0) {
      matchedJd = jds[0];
    }

    if (matchedJd) {
      setSelectedJdId(matchedJd.id);
      setTargetRole(matchedJd.title);
    } else {
      setTargetRole(item.role);
    }

    if (autoScoreOnSelect) {
      triggerAnalyzeWithParams(
        item.candidateName,
        matchedJd?.title || item.role,
        matchedJd?.id || selectedJdId,
        item.expYears,
        item.text
      );
    }
  };

  // Handle local file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setUploadedFileSize((file.size / 1024).toFixed(1) + ' KB');
    setExtractError(null);

    // Attempt to guess name from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').split(/[-_ ]/)[0] || '候选人';
    setCandidateName(cleanName);

    const form = new FormData();
    form.append('file', file);

    setIsExtracting(true);
    try {
      const res = await fetch('/api/resume/extract', { method: 'POST', body: form });
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || '解析失败');
      }
      const text = json.data.text || '';
      setResumeText(text);
      setExtractedFileMeta({
        token: json.data.fileToken,
        name: json.data.fileName,
        mime: json.data.mimeType,
        size: json.data.fileSize,
      });
      if (json.data.warning) {
        setExtractError(json.data.warning);
      }
      if (autoScoreOnSelect && text.trim()) {
        triggerAnalyzeWithParams(cleanName, targetRole, selectedJdId, experienceYears, text);
      } else if (!text.trim() && !json.data.warning) {
        setExtractError('未能从文件中提取到文本，请确认文件未损坏或手动粘贴文本。');
      }
    } catch (err: any) {
      console.error(err);
      setExtractError('简历解析失败：' + (err?.message || err));
      setResumeText('');
      setExtractedFileMeta(null);
    } finally {
      setIsExtracting(false);
    }
  };

  // Clear uploaded file
  const handleClearUpload = () => {
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setExtractError(null);
    setResumeText('');
    setExtractedFileMeta(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Main Core AI Analysis Function
  const triggerAnalyzeWithParams = async (
    name: string,
    role: string,
    jdId: string,
    exp: number,
    text: string
  ): Promise<boolean> => {
    if (!text.trim()) {
      alert('请先选择一份简历或上传简历文本内容');
      return false;
    }

    const selectedJd = jds.find((j) => j.id === jdId);
    const jdContext = selectedJd
      ? `岗位：${selectedJd.title}\n部门：${selectedJd.department}\n职级：${selectedJd.level}\n职责：${selectedJd.responsibilities.join(';')}\n要求：${selectedJd.requirements.join(';')}`
      : `岗位：${role}`;

    setIsAnalyzing(true);

    try {
      const task = await api.submitScreeningTask({
        resumeText: text,
        candidateName: name.trim() || '候选人',
        targetRole: role || '核心专业岗位',
        targetJd: jdContext,
        experienceYears: exp,
        targetJdId: jdId,
        targetJdTitle: selectedJd?.title,
        originalFile: extractedFileMeta ?? undefined,
      });

      setTasks((prev) => {
        const next = [task, ...prev];
        return next;
      });
      setSavedSuccess(false);
      setEvaluationResult(null);
      return true;
    } catch (err: any) {
      console.error(err);
      alert('提交评估任务失败：' + (err.message || err));
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 5 秒倒计时冷却
  const startScoreCooldown = () => {
    if (scoreCooldownTimer.current) clearInterval(scoreCooldownTimer.current);
    let remaining = 5;
    setScoreCooldown(remaining);
    scoreCooldownTimer.current = setInterval(() => {
      remaining -= 1;
      setScoreCooldown(remaining);
      if (remaining <= 0 && scoreCooldownTimer.current) {
        clearInterval(scoreCooldownTimer.current);
        scoreCooldownTimer.current = null;
      }
    }, 1000);
  };

  // 清空左侧「简历选择 / 上传」与「对齐 JD」两项输入
  const clearScreeningInputs = () => {
    setSelectedPoolId(null);
    setResumeText('');
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setExtractError(null);
    setExtractedFileMeta(null);
    setCandidateName('');
    setExperienceYears(0);
    setTargetRole('');
    setSelectedJdId('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualAnalyze = async () => {
    const ok = await triggerAnalyzeWithParams(
      candidateName,
      targetRole,
      selectedJdId,
      experienceYears,
      resumeText
    );
    if (ok) {
      clearScreeningInputs();
      startScoreCooldown();
    }
  };

  const handleCopyReport = () => {
    if (!evaluationResult) return;
    const text = formatEvaluationAsText(evaluationResult);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (score >= 80) return 'text-blue-700 bg-blue-50 border-blue-300';
    if (score >= 70) return 'text-amber-700 bg-amber-50 border-amber-300';
    return 'text-rose-700 bg-rose-50 border-rose-300';
  };

  const getRecommendationBadge = (rec: RecommendationType) => {
    switch (rec) {
      case '强烈推荐':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case '建议初试':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case '待定/储备':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  const getTaskStatusMeta = (status: ScreeningTask['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: '排队中',
          className: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'running':
        return {
          label: '评估中',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      case 'completed':
        return {
          label: '已完成',
          className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'failed':
        return {
          label: '失败',
          className: 'bg-rose-50 text-rose-700 border-rose-200',
        };
    }
  };

  const currentSelectedJd = jds.find((j) => j.id === selectedJdId);

  return (
    <div className="space-y-6">
      {/* Main Symmetrical 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: 3-Step Setup Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            
            {/* Step 1: Resume Selection / Upload */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span>选择或上传候选人简历</span>
                </label>

                {/* Source Mode Tabs */}
                <div className="flex items-center p-0.5 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setResumeSource('existing')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      resumeSource === 'existing'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    已有简历库
                  </button>
                  <button
                    type="button"
                    onClick={() => setResumeSource('upload')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      resumeSource === 'upload'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    上传新简历
                  </button>
                </div>
              </div>

              {/* Mode A: Existing Talent Pool Cards */}
              {resumeSource === 'existing' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">点击直接选中并自动载入候选人档案：</span>
                    {poolItems.length > 0 && (
                      <span className="text-[11px] text-slate-400 tabular-nums shrink-0 ml-2">
                        显示 {poolVisibleRange.start}–{poolVisibleRange.end} / 共 {poolItems.length} 位
                      </span>
                    )}
                  </div>

                  {poolItems.length === 0 ? (
                    <div className="text-center py-6 px-4 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      暂无已归档简历，请上传新简历或先完成一次评估
                    </div>
                  ) : (
                    <div className="relative">
                      {/* 向上滑动按钮 */}
                      <button
                        type="button"
                        onClick={() => scrollPool(-1)}
                        disabled={!poolCanUp}
                        title="向上滑动"
                        className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                        上滑
                      </button>

                      {/* 滑动窗口：一次最多显示 5 位候选人 */}
                      <div
                        ref={poolScrollRef}
                        onScroll={updatePoolScroll}
                        style={{ scrollbarWidth: 'thin' }}
                        className="max-h-[208px] overflow-y-auto flex flex-col gap-2 py-2 pr-1 scroll-smooth"
                      >
                        {poolItems.map((item) => {
                          const isSelected = selectedPoolId === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => handleSelectPoolCandidate(item.id)}
                              style={{ height: '64px' }}
                              className={`shrink-0 px-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-blue-50/80 border-blue-400 ring-1 ring-blue-400'
                                  : 'bg-slate-50/90 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                  isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'
                                }`}>
                                  {item.name.slice(0, 1)}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate">
                                    {item.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {item.role}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 ml-2">
                                {isSelected ? (
                                  <span className="text-xs font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Check className="w-3 h-3" /> 已选
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-400">选择</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 向下滑动按钮 */}
                      <button
                        type="button"
                        onClick={() => scrollPool(1)}
                        disabled={!poolCanDown}
                        title="向下滑动"
                        className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        下滑
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Upload File Area */}
              {resumeSource === 'upload' && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-5 text-center cursor-pointer bg-slate-50/60 hover:bg-blue-50/20 transition flex flex-col items-center justify-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.md,.pdf,.doc,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        点击上传简历文档 或 拖拽文件至此
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        支持 TXT, Markdown, Word, PDF 文本格式
                      </div>
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileUp className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-emerald-900 truncate">{uploadedFileName}</span>
                        <span className="text-emerald-600 text-[11px]">({uploadedFileSize})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearUpload}
                        className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                        title="清除文件"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {isExtracting && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>正在解析文档并提取文本…</span>
                    </div>
                  )}

                  {extractError && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                      <span className="font-semibold">提示：</span>
                      {extractError}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Target Position Selection */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <span>选择对齐的在招岗位 (JD)</span>
              </label>

              <div className="space-y-2">
                <select
                  value={selectedJdId}
                  onChange={(e) => handleJdChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="">未选择岗位（请重新选择）</option>
                  {jds.map((jd) => (
                    <option key={jd.id} value={jd.id}>
                      {jd.title} · {jd.department} ({jd.salaryRange})
                    </option>
                  ))}
                </select>

                {currentSelectedJd && (
                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-900">{currentSelectedJd.level}</span>
                      <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">
                        {currentSelectedJd.salaryRange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      💡 {currentSelectedJd.oneSentencePitch}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: Trigger AI Score */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isAnalyzing || !resumeText.trim() || scoreCooldown > 0}
                onClick={handleManualAnalyze}
                className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-sm shadow-blue-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>正在加入评估队列…</span>
                  </>
                ) : scoreCooldown > 0 ? (
                  <>
                    <Clock className="w-4.5 h-4.5" />
                    <span>请稍候 {scoreCooldown}s 后可再次评估</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>立即启动 AI 自动评估打分</span>
                  </>
                )}
              </button>
            </div>

            {/* Task Queue / History Panel */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <List className="w-4 h-4 text-slate-500" />
                  <span>评估队列与最近任务</span>
                </label>
                <button
                  type="button"
                  onClick={refreshTasks}
                  disabled={tasksLoading}
                  className="text-xs flex items-center gap-1 text-slate-600 hover:text-blue-600 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${tasksLoading ? 'animate-spin' : ''}`} />
                  刷新
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-4 px-3 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  暂无排队中的评估任务
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {tasks.map((task) => {
                    const statusMeta = getTaskStatusMeta(task.status);
                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl border bg-white border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {task.candidateName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {task.appliedRole}
                            </div>
                          </div>
                          <span
                            className={`shrink-0 text-[11px] px-2 py-0.5 rounded-md font-semibold border ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{task.createdAt}</span>
                          {task.status === 'pending' && task.position > 0 && (
                            <span>排队位置：{task.position}</span>
                          )}
                        </div>

                        {task.status === 'failed' && task.error && (
                          <div className="text-[11px] text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100">
                            {task.error}
                          </div>
                        )}

                        {task.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            {task.evaluationId && (
                              <button
                                type="button"
                                onClick={() => displayTaskResult(task)}
                                className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                查看评估结果
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: AI Score & Multi-dimensional Report (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {evaluationResult ? (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Header Score & Status Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-black text-lg shrink-0 shadow-xs">
                      {evaluationResult.candidateName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold text-slate-900">{evaluationResult.candidateName}</h2>
                        <span className={`text-xs px-3 py-1 rounded-full font-bold border ${getRecommendationBadge(evaluationResult.recommendation)}`}>
                          {evaluationResult.recommendation}
                        </span>
                        {savedSuccess && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> 已自动归档评估库
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-3 flex-wrap">
                        <span>对齐岗位：<strong className="text-slate-800">{evaluationResult.appliedRole}</strong></span>
                        <span>·</span>
                        <span>经验：{evaluationResult.experienceYears} 年</span>
                        <span>·</span>
                        <span>{evaluationResult.education}</span>
                      </div>
                    </div>
                  </div>

                  {/* Big Overall Score Badge */}
                  <div className={`text-center px-5 py-3 rounded-2xl border ${getScoreColor(evaluationResult.overallScore)} shrink-0 shadow-xs`}>
                    <div className="text-3.5xl font-black tracking-tight leading-none">{evaluationResult.overallScore}</div>
                    <div className="text-xs font-bold uppercase tracking-wider mt-1">AI 综合匹配得分</div>
                  </div>
                </div>

                {/* 5-Dimension Objective Breakdown */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Award className="w-4 h-4 text-blue-600" />
                      <span>五维画像智能量化评估</span>
                    </span>
                    <span className="text-xs text-slate-400">满分 100 分 · 客观加权</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { label: '专业硬技能', score: evaluationResult.dimensionScores.hardSkills, desc: '技术深度/工具链' },
                      { label: '业务项目匹配', score: evaluationResult.dimensionScores.experienceMatch, desc: '行业与量化成果' },
                      { label: '稳定性与潜力', score: evaluationResult.dimensionScores.stabilityGrowth, desc: '跳槽频率与成长性' },
                      { label: '职级薪酬契合', score: evaluationResult.dimensionScores.compensationFit, desc: '预算与定级匹配' },
                      { label: '沟通与领导力', score: evaluationResult.dimensionScores.softSkills, desc: '协作协同能力' },
                    ].map((item, idx) => (
                      <div key={idx} className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 text-center">
                        <div className="text-xs font-semibold text-slate-700">{item.label}</div>
                        <div className="text-2xl font-black text-blue-700 my-1">{item.score}</div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 truncate">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 flex-wrap gap-2">
                  <div className="text-xs text-slate-400">
                    评估引擎：{evaluationResult.evaluatorName} · {evaluationResult.screeningDate}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyReport}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      title="复制格式化评估报告"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      <span>{copied ? '已复制报告' : '复制简报'}</span>
                    </button>

                    <button
                      onClick={() => printCandidateReport(evaluationResult)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                      title="导出或打印完整PDF报告"
                    >
                      <Printer className="w-4 h-4" />
                      <span>导出 / 打印报告</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>高管速览简评 (Executive Summary)</span>
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/90 p-4 rounded-xl border border-slate-200/70 font-sans">
                  {evaluationResult.summary}
                </p>
              </div>

              {/* Strengths & Red Flags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Core Strengths */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                    <Award className="w-4.5 h-4.5 text-emerald-600" />
                    <span>核心亮点与竞争力</span>
                  </h3>
                  <div className="space-y-2.5">
                    {evaluationResult.keyHighlights.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200/70">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Red Flags / Risk Points */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                  <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
                    <span>潜在疑点与关注点 (Red Flags)</span>
                  </h3>
                  <div className="space-y-2.5">
                    {evaluationResult.potentialRisks.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/70">
                        <span className="text-amber-600 font-bold shrink-0 mt-0.5 text-sm">!</span>
                        <span className="leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Targeted Interview Questions */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-4.5 h-4.5 text-blue-600" />
                    <span>面试官定向提问建议 (带考察逻辑)</span>
                  </h3>
                  <span className="text-xs text-slate-400">供初试与专业复试直接参考</span>
                </div>

                <div className="space-y-3">
                  {evaluationResult.recommendedQuestions.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-2">
                      <div className="flex items-start gap-2.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 shrink-0">
                          {q.category}
                        </span>
                        <p className="text-sm font-bold text-slate-900 leading-snug">
                          {q.question}
                        </p>
                      </div>
                      <div className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200/70">
                        <strong className="text-slate-700">考察意图：</strong>
                        {q.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center min-h-[500px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">等待启动智能打分</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
                  在左侧选择已有候选人或上传新简历，选定要对齐的在招岗位，点击“立即启动 AI 自动评估打分”，AI 将输出五维画像、亮点与风险分析及定向面试题。
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
