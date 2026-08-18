import React from 'react';
import {
  Sparkles,
  FileText,
  Briefcase,
  TrendingUp,
  Award,
  Users,
  ArrowRight,
  CheckCircle2,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { ActiveTab, CandidateEvaluation, JobDescription, UserProfile } from '../types';
import { printCandidateReport } from '../utils/exportReport';

interface DashboardOverviewProps {
  user: UserProfile;
  evaluations: CandidateEvaluation[];
  jds: JobDescription[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectJdForScreening: (jdId: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  user,
  evaluations,
  jds,
  setActiveTab,
  onSelectJdForScreening,
}) => {
  // 统一时间转数值（兼容 "YYYY-MM-DD HH:mm"），用于倒排
  const timeValue = (s?: string) => new Date((s || '').replace(' ', 'T')).getTime() || 0;

  // 最新初筛报告：按评估时间倒排，最多显示 3 条
  const topCandidates = [...evaluations]
    .sort((a, b) => timeValue(b.screeningDate) - timeValue(a.screeningDate))
    .slice(0, 3);

  // 招聘职位 JD：按更新时间倒排（兜底创建时间），最多显示 3 条
  const recentJds = [...jds]
    .sort(
      (a, b) =>
        timeValue(b.updatedAt) - timeValue(a.updatedAt) ||
        timeValue(b.createdAt) - timeValue(a.createdAt)
    )
    .slice(0, 3);
  const avgScore = evaluations.length > 0 ? Math.round(evaluations.reduce((acc, c) => acc + c.overallScore, 0) / evaluations.length) : 0;
  const highMatchCount = evaluations.filter((e) => e.overallScore >= 90).length;

  return (
    <div className="space-y-6">
      {/* 4 Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-600">初筛候选人</div>
            <div className="text-3xl font-black text-slate-900 mt-1.5">{evaluations.length}</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-600">综合平均分</div>
            <div className="text-3xl font-black text-blue-600 mt-1.5">
              {avgScore} <span className="text-sm font-normal text-slate-400">/ 100</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-600">强烈推荐人才</div>
            <div className="text-3xl font-black text-emerald-600 mt-1.5">
              {highMatchCount} <span className="text-sm font-normal text-slate-400">人</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-600">在招职位 JD</div>
            <div className="text-3xl font-black text-slate-900 mt-1.5">
              {jds.length} <span className="text-sm font-normal text-slate-400">个</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Recent Evaluations & Active Job Openings (Symmetric 2-Column Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side: Recent Candidate Evaluations */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>最新初筛报告</span>
              </h2>

              <button
                onClick={() => setActiveTab('history-reports')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer transition"
              >
                <span>查看全部 ({evaluations.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {topCandidates.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-50/90 hover:bg-blue-50/40 border border-slate-200/80 hover:border-blue-200 transition space-y-3"
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                        {c.candidateName.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{c.candidateName}</div>
                        <div className="text-xs text-slate-500 mt-0.5 truncate">{c.appliedRole}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-blue-700 leading-none">{c.overallScore} 分</div>
                        <span className="text-xs font-semibold text-emerald-700 mt-0.5 inline-block">{c.recommendation}</span>
                      </div>

                      <button
                        onClick={() => printCandidateReport(c)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs transition cursor-pointer shadow-xs"
                        title="导出/打印 PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Middle Summary Text */}
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed min-h-[44px] flex items-center">
                    {c.summary}
                  </p>

                  {/* Bottom Divider & Action Bar (Symmetric to Right JD Card) */}
                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-xs text-slate-500">{c.experienceYears}年经验 · {c.education}</span>
                    <button
                      onClick={() => setActiveTab('history-reports')}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition"
                    >
                      <span>查看评估详情</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Active JDs in Pipeline */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-indigo-600" />
                <span>招聘职位 JD</span>
              </h2>

              <button
                onClick={() => setActiveTab('jd-agent')}
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition"
              >
                <span>+ 生成新 JD</span>
              </button>
            </div>

            <div className="space-y-4">
              {recentJds.map((jd) => (
                <div
                  key={jd.id}
                  className="p-4 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-3 hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{jd.title}</h3>
                      <div className="text-xs text-slate-500 mt-0.5">{jd.department} · {jd.level}</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md shrink-0">
                      {jd.salaryRange}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed min-h-[44px] flex items-center">
                    💡 {jd.oneSentencePitch}
                  </p>

                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-xs">
                    <span className="text-xs text-slate-500">{jd.experience} · {jd.education}</span>
                    <button
                      onClick={() => onSelectJdForScreening(jd.id)}
                      className="text-blue-600 hover:text-blue-700 font-semibold text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition"
                    >
                      <span>以此初筛简历</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

