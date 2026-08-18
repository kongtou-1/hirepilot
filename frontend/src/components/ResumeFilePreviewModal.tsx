import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import { CandidateEvaluation } from '../types';
import { api } from '../utils/api';

interface ResumeFilePreviewModalProps {
  candidate: CandidateEvaluation;
  onClose: () => void;
}

export const ResumeFilePreviewModal: React.FC<ResumeFilePreviewModalProps> = ({
  candidate,
  onClose,
}) => {
  const file = candidate.originalFile;
  const fileUrl = api.evaluationFileUrl(candidate.id);
  const isPdf = file?.mime === 'application/pdf';
  const isImage = !!file?.mime?.startsWith('image/');
  const [showText, setShowText] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(candidate.rawResumeText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {candidate.candidateName} · 原始简历档案
              </h2>
              <div className="text-xs text-slate-500 mt-0.5">
                应聘岗位：{candidate.appliedRole} | {file ? file.name : '仅提取文本'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制简历文本</span>
                </>
              )}
            </button>
            {file && (
              <a
                href={api.evaluationFileUrl(candidate.id, true)}
                download={file.name}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载原文件</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          {file && isPdf && !loadError && (
            <iframe
              src={fileUrl}
              title="简历预览"
              className="w-full h-[72vh] rounded-xl border border-slate-200 bg-white"
              onError={() => setLoadError(true)}
            />
          )}
          {file && isImage && !loadError && (
            <img
              src={fileUrl}
              alt="简历预览"
              className="max-h-[72vh] mx-auto rounded-xl border border-slate-200 bg-white"
              onError={() => setLoadError(true)}
            />
          )}
          {(loadError || (file && !isPdf && !isImage)) && (
            <div className="max-w-md mx-auto text-center bg-white border border-slate-200 rounded-xl p-8">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600 mb-4">
                浏览器暂不支持在线预览该格式，请点击右上角「下载原文件」查看。
              </p>
              <a
                href={api.evaluationFileUrl(candidate.id, true)}
                download={file?.name}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>下载原文件</span>
              </a>
            </div>
          )}
          {!file && (
            <div>
              <div className="max-w-md mx-auto mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  该记录未关联原始文件（历史数据或经简历库重筛生成），以下为当时提取的简历文本内容。
                </span>
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[72vh] overflow-y-auto border border-slate-800">
                {candidate.rawResumeText || '（无原始简历文本）'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-white">
          <button
            onClick={() => setShowText((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition cursor-pointer"
          >
            {showText ? '隐藏提取文本' : '查看提取文本'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            关闭
          </button>
        </div>
        {showText && (
          <div className="px-6 pb-4 bg-white">
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[40vh] overflow-y-auto border border-slate-800">
              {candidate.rawResumeText || '（无提取文本）'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
