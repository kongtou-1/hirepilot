import { CandidateEvaluation, JobDescription, OriginalFileMeta, ScreeningTask } from '../types';

const BASE = '/api';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

  if (!res.ok) {
    let msg = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      if (body && typeof body.error === 'string') msg = body.error;
    } catch {
      // 响应体非 JSON，忽略
    }
    throw new Error(msg);
  }

  // 204 No Content 无需解析
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  // ---------------- JD ----------------
  getJds: () => http<JobDescription[]>('/jds'),
  upsertJd: (jd: JobDescription) =>
    http<JobDescription>('/jds', { method: 'POST', body: JSON.stringify(jd) }),
  deleteJd: (id: string) =>
    http<void>(`/jds/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ---------------- 评估 ----------------
  getEvaluations: () => http<CandidateEvaluation[]>('/evaluations'),
  getEvaluation: (id: string) =>
    http<CandidateEvaluation>(`/evaluations/${encodeURIComponent(id)}`),
  upsertEvaluation: (evaluation: CandidateEvaluation) =>
    http<CandidateEvaluation>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluation),
    }),
  deleteEvaluation: (id: string) =>
    http<void>(`/evaluations/${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // ---------------- 简历筛选异步队列 ----------------
  submitScreeningTask: (payload: {
    resumeText: string;
    candidateName?: string;
    targetRole?: string;
    targetJd?: string;
    experienceYears?: number;
    targetJdId?: string;
    targetJdTitle?: string;
    originalFile?: OriginalFileMeta;
  }) => http<{ data: ScreeningTask }>('/resume/screen/async', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((res) => res.data),

  getScreeningTask: (id: string) =>
    http<{ data: ScreeningTask }>(`/resume/screen/tasks/${encodeURIComponent(id)}`).then(
      (res) => res.data
    ),

  // ---------------- 原始简历文件 ----------------
  evaluationFileUrl: (id: string, download = false) =>
    `/api/evaluations/${encodeURIComponent(id)}/file${download ? '?download=1' : ''}`,

  listScreeningTasks: () =>
    http<{ data: ScreeningTask[] }>('/resume/screen/tasks').then((res) => res.data),
};
