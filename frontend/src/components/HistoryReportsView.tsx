import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  Trash2,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  ArrowUpDown,
  FileSpreadsheet,
  X,
  Layers,
  ChevronRight,
  Briefcase,
  Plus,
  Send,
  FileText,
  Sparkles,
  Edit3,
  Save,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { CandidateEvaluation, JobDescription, ScreeningStatus, RecommendationType } from '../types';
import { exportEvaluationsToCSV, formatEvaluationAsText, printCandidateReport } from '../utils/exportReport';
import { ResumeFilePreviewModal } from './ResumeFilePreviewModal';

interface HistoryReportsViewProps {
  evaluations: CandidateEvaluation[];
  jds?: JobDescription[];
  onUpdateStatus: (id: string, status: ScreeningStatus) => void;
  onDeleteEvaluation: (id: string) => void;
  onSelectForScreening: () => void;
  onSelectJdForScreening?: (jdId: string) => void;
  onDeleteJd?: (jdId: string) => void;
  onEditJd?: (jd: JobDescription) => void;
  onSaveJd?: (jd: JobDescription) => void;
  onCreateNewJd?: () => void;
}

export const HistoryReportsView: React.FC<HistoryReportsViewProps> = ({
  evaluations,
  jds = [],
  onUpdateStatus,
  onDeleteEvaluation,
  onSelectForScreening,
  onSelectJdForScreening,
  onDeleteJd,
  onEditJd,
  onSaveJd,
  onCreateNewJd,
}) => {
  // Main subtab: 'resumes' (简历筛选历史) vs 'jds' (历史 JD 生成)
  const [activeSubTab, setActiveSubTab] = useState<'resumes' | 'jds'>('resumes');

  // Resume screening filters & states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [scoreFilter, setScoreFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateEvaluation | null>(null);
  const [rawResumeCandidate, setRawResumeCandidate] = useState<CandidateEvaluation | null>(null);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // JD history filters & states
  const [jdSearchTerm, setJdSearchTerm] = useState('');
  const [jdSelectedDept, setJdSelectedDept] = useState('ALL');
  const [copiedJdId, setCopiedJdId] = useState<string | null>(null);
  const [copiedRawResume, setCopiedRawResume] = useState<boolean>(false);
  
  // JD Editing Modal State
  const [editingJdData, setEditingJdData] = useState<JobDescription | null>(null);
  const [saveJdSuccessToast, setSaveJdSuccessToast] = useState(false);

  // Unique roles for filtering resumes
  const uniqueRoles = useMemo(() => {
    const roles = Array.from(new Set(evaluations.map((e) => e.appliedRole)));
    return roles;
  }, [evaluations]);

  // Unique departments for filtering JDs
  const jdDepartments = useMemo(() => {
    const depts = Array.from(new Set(jds.map((j) => j.department)));
    return depts;
  }, [jds]);

  // 统一时间转数值（兼容 "YYYY-MM-DD HH:mm" 格式），用于倒排
  const timeValue = (s?: string) => new Date((s || '').replace(' ', 'T')).getTime() || 0;

  // Filtered evaluations list (按评估时间倒排)
  const filteredEvaluations = useMemo(() => {
    return evaluations
      .filter((item) => {
        const matchSearch =
          item.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.appliedRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.education.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.currentCompany.toLowerCase().includes(searchTerm.toLowerCase());

        const matchRole = selectedRole === 'ALL' || item.appliedRole === selectedRole;

        let matchScore = true;
        if (scoreFilter === '90+') matchScore = item.overallScore >= 90;
        else if (scoreFilter === '80-89') matchScore = item.overallScore >= 80 && item.overallScore < 90;
        else if (scoreFilter === '<80') matchScore = item.overallScore < 80;

        const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

        return matchSearch && matchRole && matchScore && matchStatus;
      })
      .sort((a, b) => timeValue(b.screeningDate) - timeValue(a.screeningDate));
  }, [evaluations, searchTerm, selectedRole, scoreFilter, statusFilter]);

  // Filtered JDs list (按更新时间倒排，兜底创建时间)
  const filteredJds = useMemo(() => {
    return jds
      .filter((jd) => {
        const matchSearch =
          jd.title.toLowerCase().includes(jdSearchTerm.toLowerCase()) ||
          jd.department.toLowerCase().includes(jdSearchTerm.toLowerCase()) ||
          jd.requirements.some((r) => r.toLowerCase().includes(jdSearchTerm.toLowerCase())) ||
          jd.oneSentencePitch.toLowerCase().includes(jdSearchTerm.toLowerCase());
        const matchDept = jdSelectedDept === 'ALL' || jd.department === jdSelectedDept;
        return matchSearch && matchDept;
      })
      .sort(
        (a, b) =>
          timeValue(b.updatedAt) - timeValue(a.updatedAt) ||
          timeValue(b.createdAt) - timeValue(a.createdAt)
      );
  }, [jds, jdSearchTerm, jdSelectedDept]);

  const handleCopySingle = (c: CandidateEvaluation) => {
    const text = formatEvaluationAsText(c);
    navigator.clipboard.writeText(text);
    setCopiedId(c.id);
    setTimeout(() => setCopiedId(null), 2000);
  };


  const handleCopyJd = (jd: JobDescription) => {
    const text = `【招聘】${jd.title} (${jd.level})
所属部门：${jd.department} | 薪资：${jd.salaryRange}
地点：${jd.location} (${jd.workMode})

【岗位亮点】
${jd.oneSentencePitch}

【岗位职责】
${jd.responsibilities.map((r, i) => `${i + 1}. ${r}`).join('\n')}

【任职要求】
${jd.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

【优先加分】
${jd.preferredSkills.join('\n')}

【福利待遇】
${jd.benefits.join('、')}
`;
    navigator.clipboard.writeText(text);
    setCopiedJdId(jd.id);
    setTimeout(() => setCopiedJdId(null), 2000);
  };

  const handleCopyRawResume = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRawResume(true);
    setTimeout(() => setCopiedRawResume(false), 2000);
  };

  const toggleComparison = (id: string) => {
    if (comparisonIds.includes(id)) {
      setComparisonIds(comparisonIds.filter((item) => item !== id));
    } else {
      if (comparisonIds.length >= 3) {
        alert('最多支持同时横向对比 3 位候选人');
        return;
      }
      setComparisonIds([...comparisonIds, id]);
    }
  };

  const comparisonCandidates = useMemo(() => {
    return evaluations.filter((e) => comparisonIds.includes(e.id));
  }, [evaluations, comparisonIds]);

  const getStatusBadge = (status: ScreeningStatus) => {
    switch (status) {
      case 'NEW':
        return { label: '待处理', class: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'INVITED':
        return { label: '已邀约初试', class: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'INTERVIEWING':
        return { label: '复试评估中', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'OFFERED':
        return { label: '已发Offer', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'REJECTED':
        return { label: '已淘汰/储备', class: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
  };

  // Open direct JD edit modal
  const handleOpenEditJdModal = (jd: JobDescription) => {
    setEditingJdData({ ...jd });
  };

  // Save changes to JD
  const handleSaveJdEdits = () => {
    if (!editingJdData) return;
    if (!editingJdData.title.trim()) {
      alert('请填写职位名称');
      return;
    }

    const updated: JobDescription = {
      ...editingJdData,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      version: (editingJdData.version || 1) + 1,
    };

    if (onSaveJd) {
      onSaveJd(updated);
    }
    setEditingJdData(null);
    setSaveJdSuccessToast(true);
    setTimeout(() => setSaveJdSuccessToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Switcher Cards: 简历筛选历史 vs 历史 JD 生成 (Clean without descriptions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: 简历筛选历史 */}
        <button
          type="button"
          onClick={() => setActiveSubTab('resumes')}
          className={`text-left p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between relative ${
            activeSubTab === 'resumes'
              ? 'bg-white border-blue-500 shadow-sm ring-2 ring-blue-500/10'
              : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                activeSubTab === 'resumes' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-600'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">简历筛选历史</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeSubTab === 'resumes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {evaluations.length} 份档案
              </span>
            </div>
          </div>
          {activeSubTab === 'resumes' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" /> 当前展示
            </span>
          )}
        </button>

        {/* Card 2: 历史 JD 生成 */}
        <button
          type="button"
          onClick={() => setActiveSubTab('jds')}
          className={`text-left p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between relative ${
            activeSubTab === 'jds'
              ? 'bg-white border-indigo-500 shadow-sm ring-2 ring-indigo-500/10'
              : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                activeSubTab === 'jds' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-600'
              }`}
            >
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">历史 JD 生成</h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  activeSubTab === 'jds' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {jds.length} 份职位
              </span>
            </div>
          </div>
          {activeSubTab === 'jds' && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" /> 当前展示
            </span>
          )}
        </button>
      </div>

      {/* Success Toast */}
      {saveJdSuccessToast && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>职位 JD 修改已成功保存并实时同步更新！</span>
          </div>
          <button onClick={() => setSaveJdSuccessToast(false)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUBTAB 1: 简历筛选历史 CONTENT */}
      {activeSubTab === 'resumes' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Filter & Search Toolbar with CSV Export and Comparison */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索候选人姓名、应聘岗位、毕业院校、就职公司..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Role Filter */}
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">全部目标岗位</option>
                {uniqueRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Score Tier Filter */}
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">全部打分区间</option>
                <option value="90+">90分以上 (强烈推荐)</option>
                <option value="80-89">80-89分 (建议初试)</option>
                <option value="<80">80分以下 (待定/储备)</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">全部流程状态</option>
                <option value="NEW">待处理</option>
                <option value="INVITED">已邀约初试</option>
                <option value="INTERVIEWING">复试评估中</option>
                <option value="OFFERED">已发Offer</option>
                <option value="REJECTED">已淘汰/储备</option>
              </select>

              {(searchTerm || selectedRole !== 'ALL' || scoreFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedRole('ALL');
                    setScoreFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs px-2 py-1 cursor-pointer"
                >
                  重置筛选
                </button>
              )}

              {/* Comparison Button */}
              {comparisonIds.length > 0 && (
                <button
                  onClick={() => setShowComparisonModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>横向对比 ({comparisonIds.length})</span>
                </button>
              )}

              {/* CSV Export Button */}
              <button
                onClick={() => exportEvaluationsToCSV(filteredEvaluations)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition cursor-pointer shadow-xs"
                title="导出当前筛选结果为完整 CSV 报表"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>导出 CSV 报表</span>
              </button>
            </div>
          </div>

          {/* Candidate List Cards */}
          <div className="space-y-3">
            {filteredEvaluations.length > 0 ? (
              filteredEvaluations.map((item) => {
                const statusInfo = getStatusBadge(item.status);
                const isComparing = comparisonIds.includes(item.id);

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left Profile Info */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isComparing}
                          onChange={() => toggleComparison(item.id)}
                          className="mt-1 rounded bg-slate-100 border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer"
                          title="勾选以参与横向对比"
                        />

                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm shrink-0">
                          {item.candidateName.slice(0, 1)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-sm">{item.candidateName}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                              {item.appliedRole}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                item.overallScore >= 90
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.overallScore >= 80
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {item.overallScore} 分 · {item.recommendation}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                            <span>🎓 {item.education}</span>
                            <span>⏱ {item.experienceYears} 年工作经验</span>
                            <span>🏢 {item.currentCompany}</span>
                            <span className="text-slate-400">📅 评估于 {item.screeningDate}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status and Action Buttons with "查看原始简历" Button */}
                      <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as ScreeningStatus)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-xl border ${statusInfo.class} cursor-pointer focus:outline-none`}
                        >
                          <option value="NEW">待处理</option>
                          <option value="INVITED">已邀约初试</option>
                          <option value="INTERVIEWING">复试评估中</option>
                          <option value="OFFERED">已发Offer</option>
                          <option value="REJECTED">已淘汰/储备</option>
                        </select>

                        {/* View Candidate Report */}
                        <button
                          onClick={() => setSelectedCandidate(item)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          查看详情报告
                        </button>

                        {/* View Original Resume Button (图一要求) */}
                        <button
                          onClick={() => setRawResumeCandidate(item)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                          title="查看候选人原始简历全文与完整履历"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>查看原始简历</span>
                        </button>

                        <button
                          onClick={() => handleCopySingle(item)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs transition cursor-pointer"
                          title="复制候选人面评"
                        >
                          {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`确定要删除候选人【${item.candidateName}】的评估记录吗？`)) {
                              onDeleteEvaluation(item.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="删除记录"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Summary & 5 Dim Scores */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <p className="text-slate-600 flex-1 leading-relaxed line-clamp-1">
                        <span className="font-semibold text-slate-800">💡 核心简评：</span>
                        {item.summary}
                      </p>

                      <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-500 border-t md:border-t-0 md:border-l border-slate-200 pt-2 md:pt-0 md:pl-3">
                        <div>硬技能: <b className="text-slate-800 font-mono">{item.dimensionScores.hardSkills}</b></div>
                        <div>项目契合: <b className="text-slate-800 font-mono">{item.dimensionScores.experienceMatch}</b></div>
                        <div>稳定性: <b className="text-slate-800 font-mono">{item.dimensionScores.stabilityGrowth}</b></div>
                        <div>薪酬契合: <b className="text-slate-800 font-mono">{item.dimensionScores.compensationFit}</b></div>
                        <div>软技能: <b className="text-slate-800 font-mono">{item.dimensionScores.softSkills}</b></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Filter className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">未找到符合条件的候选人评估</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  可尝试调整搜索关键词、应聘岗位或打分区间筛选条件
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: 历史 JD 生成 CONTENT */}
      {activeSubTab === 'jds' && (
        <div className="space-y-3 animate-in fade-in duration-150">
          {/* Filter & Search Toolbar with "+ 生成新职位 JD" button */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={jdSearchTerm}
                onChange={(e) => setJdSearchTerm(e.target.value)}
                placeholder="搜索职位名称、所属部门、技能要求、业务亮点..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={jdSelectedDept}
                onChange={(e) => setJdSelectedDept(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none w-full sm:w-auto cursor-pointer"
              >
                <option value="ALL">全部所属部门</option>
                {jdDepartments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              {(jdSearchTerm || jdSelectedDept !== 'ALL') && (
                <button
                  onClick={() => {
                    setJdSearchTerm('');
                    setJdSelectedDept('ALL');
                  }}
                  className="text-slate-500 hover:text-slate-800 text-xs px-2 py-1 shrink-0 cursor-pointer"
                >
                  重置
                </button>
              )}

              {onCreateNewJd && (
                <button
                  onClick={onCreateNewJd}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>生成新职位 JD</span>
                </button>
              )}
            </div>
          </div>

          {/* Grid of JD Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJds.length > 0 ? (
              filteredJds.map((jd) => (
                <div
                  key={jd.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{jd.title}</h3>
                        <div className="text-xs text-slate-500 mt-0.5">{jd.department}</div>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {jd.level}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-3 flex-wrap">
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/50">
                        💰 {jd.salaryRange}
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">📍 {jd.location}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">⏱ {jd.experience}</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded">🎓 {jd.education}</span>
                    </div>

                    {/* Pitch */}
                    <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/60 mt-3 leading-relaxed">
                      💡 {jd.oneSentencePitch}
                    </p>

                    {/* Requirements summary */}
                    <div className="mt-3">
                      <div className="text-[11px] font-bold text-slate-700 mb-1">核心要求速览：</div>
                      <div className="space-y-1">
                        {jd.requirements.slice(0, 2).map((req, i) => (
                          <div key={i} className="text-xs text-slate-500 truncate">
                            • {req}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] text-slate-400">
                      更新于 {jd.updatedAt} · v{jd.version || 1}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyJd(jd)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition cursor-pointer"
                        title="复制完整 JD 文本"
                      >
                        {copiedJdId === jd.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      {/* Direct Edit Button (图二要求) */}
                      <button
                        onClick={() => handleOpenEditJdModal(jd)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                        title="在线直接编辑/微调此 JD"
                      >
                        <Edit3 className="w-3 h-3 text-slate-500" />
                        <span>编辑/微调</span>
                      </button>

                      {onSelectJdForScreening && (
                        <button
                          onClick={() => onSelectJdForScreening(jd.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>以此初筛简历</span>
                        </button>
                      )}

                      {onDeleteJd && (
                        <button
                          onClick={() => {
                            if (confirm(`确定要从历史库删除职位【${jd.title}】吗？`)) {
                              onDeleteJd(jd.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">未找到符合条件的职位 JD</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  可尝试调整搜索关键词或所属部门
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: 候选人原始简历弹窗 */}
      {rawResumeCandidate && (
        <ResumeFilePreviewModal
          candidate={rawResumeCandidate}
          onClose={() => setRawResumeCandidate(null)}
        />
      )}

      {/* MODAL 2: 编辑/微调职位 JD 弹窗 (图二要求: 编辑要能编辑jd) */}
      {editingJdData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    编辑与微调职位 JD
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    直接在线修改职位信息与任职要求，保存后立即同步至历史库与初筛标准
                  </div>
                </div>
              </div>

              <button
                onClick={() => setEditingJdData(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <div className="space-y-4 text-xs">
              {/* Row 1: Title, Dept, Level */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">职位名称 *</label>
                  <input
                    type="text"
                    value={editingJdData.title}
                    onChange={(e) => setEditingJdData({ ...editingJdData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="例如：资深全栈开发工程师"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">所属部门 *</label>
                  <input
                    type="text"
                    value={editingJdData.department}
                    onChange={(e) => setEditingJdData({ ...editingJdData, department: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="例如：核心研发中心"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">职级级别</label>
                  <input
                    type="text"
                    value={editingJdData.level}
                    onChange={(e) => setEditingJdData({ ...editingJdData, level: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="例如：资深工程师 (P6-P7)"
                  />
                </div>
              </div>

              {/* Row 2: Salary, Location, WorkMode, Experience, Education */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">薪资范围</label>
                  <input
                    type="text"
                    value={editingJdData.salaryRange}
                    onChange={(e) => setEditingJdData({ ...editingJdData, salaryRange: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="例如：30k-45k · 15薪"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">工作地点</label>
                  <input
                    type="text"
                    value={editingJdData.location}
                    onChange={(e) => setEditingJdData({ ...editingJdData, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="例如：北京 / 上海"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">工作方式</label>
                  <input
                    type="text"
                    value={editingJdData.workMode}
                    onChange={(e) => setEditingJdData({ ...editingJdData, workMode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="例如：支持混合办公"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">经验要求</label>
                  <input
                    type="text"
                    value={editingJdData.experience}
                    onChange={(e) => setEditingJdData({ ...editingJdData, experience: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="例如：5-8年"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">学历要求</label>
                  <input
                    type="text"
                    value={editingJdData.education}
                    onChange={(e) => setEditingJdData({ ...editingJdData, education: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    placeholder="例如：统招本科及以上"
                  />
                </div>
              </div>

              {/* Pitch */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">岗位一句话亮点 / 吸引力宣言</label>
                <input
                  type="text"
                  value={editingJdData.oneSentencePitch}
                  onChange={(e) => setEditingJdData({ ...editingJdData, oneSentencePitch: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-none"
                  placeholder="一句话阐述该岗位的核心价值与业务亮点..."
                />
              </div>

              {/* Responsibilities list */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">岗位职责 (Responsibilities)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingJdData({
                        ...editingJdData,
                        responsibilities: [...editingJdData.responsibilities, ''],
                      })
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> 添加一条职责
                  </button>
                </div>

                {editingJdData.responsibilities.map((resp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono w-4 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={resp}
                      onChange={(e) => {
                        const next = [...editingJdData.responsibilities];
                        next[idx] = e.target.value;
                        setEditingJdData({ ...editingJdData, responsibilities: next });
                      }}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = editingJdData.responsibilities.filter((_, i) => i !== idx);
                        setEditingJdData({ ...editingJdData, responsibilities: next });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="删除此项"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Requirements list */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">任职要求 (Requirements)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditingJdData({
                        ...editingJdData,
                        requirements: [...editingJdData.requirements, ''],
                      })
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> 添加一条要求
                  </button>
                </div>

                {editingJdData.requirements.map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono w-4 shrink-0">{idx + 1}.</span>
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => {
                        const next = [...editingJdData.requirements];
                        next[idx] = e.target.value;
                        setEditingJdData({ ...editingJdData, requirements: next });
                      }}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = editingJdData.requirements.filter((_, i) => i !== idx);
                        setEditingJdData({ ...editingJdData, requirements: next });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                      title="删除此项"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Preferred skills & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">加分项 (Preferred Skills)</label>
                  <textarea
                    rows={3}
                    value={editingJdData.preferredSkills.join('\n')}
                    onChange={(e) =>
                      setEditingJdData({
                        ...editingJdData,
                        preferredSkills: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                      })
                    }
                    placeholder="每行输入一条加分项..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none font-sans leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">团队福利与待遇 (Benefits)</label>
                  <textarea
                    rows={3}
                    value={editingJdData.benefits.join('\n')}
                    onChange={(e) =>
                      setEditingJdData({
                        ...editingJdData,
                        benefits: e.target.value.split('\n').filter((s) => s.trim().length > 0),
                      })
                    }
                    placeholder="每行输入一条福利待遇..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none font-sans leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <div className="text-xs text-slate-400">
                JD ID: {editingJdData.id}
              </div>

              <div className="flex items-center gap-2">
                {onEditJd && (
                  <button
                    type="button"
                    onClick={() => {
                      onEditJd(editingJdData);
                      setEditingJdData(null);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>前往 AI 智能体工作台微调</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setEditingJdData(null)}
                  className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  取消
                </button>

                <button
                  type="button"
                  onClick={handleSaveJdEdits}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>保存修改并更新</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detailed Modal Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center">
                  {selectedCandidate.candidateName.slice(0, 1)}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {selectedCandidate.candidateName}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {selectedCandidate.appliedRole}
                    </span>
                  </h2>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedCandidate.education} · {selectedCandidate.experienceYears}年经验 · {selectedCandidate.currentCompany}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Score & Rec */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">AI 综合匹配总分</div>
                  <div className="text-3xl font-extrabold text-blue-700 mt-0.5">{selectedCandidate.overallScore} 分</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600 text-white">
                    {selectedCandidate.recommendation}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-1">评估时间：{selectedCandidate.screeningDate}</div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-bold text-slate-800 mb-1">高管速览简评</div>
                <p className="text-xs text-slate-600 leading-relaxed">{selectedCandidate.summary}</p>
              </div>

              {/* Highlights & Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60">
                  <h4 className="text-xs font-bold text-emerald-800 mb-2">⭐ 核心优势与亮点</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {selectedCandidate.keyHighlights.map((h, i) => (
                      <li key={i} className="leading-snug">• {h}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
                  <h4 className="text-xs font-bold text-amber-800 mb-2">⚠ 潜在疑点与风险提示</h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {selectedCandidate.potentialRisks.map((r, i) => (
                      <li key={i} className="leading-snug">• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Interview Questions */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-2">面试定向提问建议</h4>
                <div className="space-y-2">
                  {selectedCandidate.recommendedQuestions.map((q, i) => (
                    <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                      <div className="font-semibold text-slate-900">Q{i + 1} [{q.category}]: {q.question}</div>
                      <div className="text-[11px] text-slate-500 mt-1">考察逻辑：{q.reason}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-xs text-slate-400">ID: {selectedCandidate.id}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const cand = selectedCandidate;
                      setSelectedCandidate(null);
                      setRawResumeCandidate(cand);
                    }}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    查看原始简历
                  </button>
                  <button
                    onClick={() => handleCopySingle(selectedCandidate)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    复制面评
                  </button>
                  <button
                    onClick={() => printCandidateReport(selectedCandidate)}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    打印 / 导出 PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-side Comparison Modal */}
      {showComparisonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">候选人横向多维对比 ({comparisonCandidates.length} 位)</h2>
                <p className="text-xs text-slate-500">直观评估不同候选人在专业硬技能、业务经验、稳定性及薪酬上的差异</p>
              </div>
              <button
                onClick={() => setShowComparisonModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparisonCandidates.map((c) => (
                <div key={c.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="border-b border-slate-200 pb-3">
                    <div className="font-bold text-slate-900 text-base">{c.candidateName}</div>
                    <div className="text-xs text-slate-500">{c.appliedRole}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{c.education} · {c.experienceYears}年</div>

                    <div className="mt-2 flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-xs font-bold text-slate-700">AI 综合分</span>
                      <span className="text-xl font-extrabold text-blue-700">{c.overallScore} 分</span>
                    </div>
                  </div>

                  {/* 5 Dimensions */}
                  <div className="space-y-1.5 text-xs bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-500">专业硬技能:</span>
                      <span className="font-bold text-slate-800">{c.dimensionScores.hardSkills}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">业务项目契合:</span>
                      <span className="font-bold text-slate-800">{c.dimensionScores.experienceMatch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">稳定性与潜力:</span>
                      <span className="font-bold text-slate-800">{c.dimensionScores.stabilityGrowth}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">薪酬职级契合:</span>
                      <span className="font-bold text-slate-800">{c.dimensionScores.compensationFit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">沟通领导力:</span>
                      <span className="font-bold text-slate-800">{c.dimensionScores.softSkills}</span>
                    </div>
                  </div>

                  {/* Top Highlight */}
                  <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 text-xs">
                    <div className="font-bold text-emerald-800 mb-1">主要优势</div>
                    <div className="text-slate-700 leading-snug">{c.keyHighlights[0]}</div>
                  </div>

                  {/* Top Risk */}
                  <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                    <div className="font-bold text-amber-800 mb-1">主要疑点</div>
                    <div className="text-slate-700 leading-snug">{c.potentialRisks[0]}</div>
                  </div>

                  <button
                    onClick={() => printCandidateReport(c)}
                    className="w-full py-2 text-xs font-semibold bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
                  >
                    导出单人报告
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
