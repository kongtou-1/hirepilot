import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Copy,
  Check,
  Send,
  Trash2,
  ExternalLink,
  MapPin,
  DollarSign,
  Calendar,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { JobDescription } from '../types';

interface JdHistoryViewProps {
  jds: JobDescription[];
  onCreateNewJd: () => void;
  onSelectJdForScreening: (jdId: string) => void;
  onDeleteJd: (jdId: string) => void;
  onEditJd: (jd: JobDescription) => void;
}

export const JdHistoryView: React.FC<JdHistoryViewProps> = ({
  jds,
  onCreateNewJd,
  onSelectJdForScreening,
  onDeleteJd,
  onEditJd,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewJd, setPreviewJd] = useState<JobDescription | null>(null);

  const departments = Array.from(new Set(jds.map((j) => j.department)));

  const filteredJds = jds.filter((jd) => {
    const matchSearch =
      jd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jd.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      jd.requirements.some((r) => r.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchDept = selectedDept === 'ALL' || jd.department === selectedDept;
    return matchSearch && matchDept;
  });

  const handleCopy = (jd: JobDescription) => {
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
    setCopiedId(jd.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Briefcase className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">职位 JD 库</h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono font-medium">
            共 {jds.length} 个职位
          </span>
        </div>

        <button
          onClick={onCreateNewJd}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>生成新职位 JD</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索职位名称、部门、技能要求..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:bg-white focus:outline-none w-full sm:w-auto"
        >
          <option value="ALL">全部所属部门</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      {/* Grid of JD Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredJds.map((jd) => (
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
                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  💰 {jd.salaryRange}
                </span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">📍 {jd.location}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded">⏱ {jd.experience}</span>
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
                  onClick={() => handleCopy(jd)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs transition"
                  title="复制 JD"
                >
                  {copiedId === jd.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => onEditJd(jd)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                >
                  编辑/微调
                </button>

                <button
                  onClick={() => onSelectJdForScreening(jd.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <Send className="w-3 h-3" />
                  <span>以此初筛简历</span>
                </button>

                <button
                  onClick={() => {
                    if (confirm(`确定要从历史库删除职位【${jd.title}】吗？`)) {
                      onDeleteJd(jd.id);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
