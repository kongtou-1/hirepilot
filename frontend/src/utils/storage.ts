import { CandidateEvaluation, JobDescription, UserProfile } from '../types';
import { INITIAL_EVALUATIONS, INITIAL_JDS, INITIAL_USER } from './mockData';
import { api } from './api';

const STORAGE_KEYS = {
  USER: 'zhipin_hr_user',
  AUTH: 'zhipin_hr_auth_token',
};

export const Storage = {
  // ---------------- 认证（保留本地，无后端鉴权） ----------------
  getUser(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && parsed.id === 'admin') {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
      return INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  },

  setUser(user: UserProfile) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  isAuthenticated(): boolean {
    return localStorage.getItem(STORAGE_KEYS.AUTH) === 'true';
  },

  setAuthenticated(isAuth: boolean) {
    if (isAuth) {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
    }
  },

  // ---------------- JD（后端 CRUD） ----------------
  async getJDs(): Promise<JobDescription[]> {
    try {
      return await api.getJds();
    } catch {
      return [];
    }
  },

  async saveJD(jd: JobDescription): Promise<JobDescription[]> {
    await api.upsertJd(jd);
    return await api.getJds();
  },

  async deleteJD(id: string): Promise<JobDescription[]> {
    await api.deleteJd(id);
    return await api.getJds();
  },

  // ---------------- 评估（后端 CRUD） ----------------
  async getEvaluations(): Promise<CandidateEvaluation[]> {
    try {
      return await api.getEvaluations();
    } catch {
      return [];
    }
  },

  async saveEvaluation(
    evaluation: CandidateEvaluation,
  ): Promise<CandidateEvaluation[]> {
    await api.upsertEvaluation(evaluation);
    return await api.getEvaluations();
  },

  async updateEvaluationStatus(
    id: string,
    status: CandidateEvaluation['status'],
  ): Promise<CandidateEvaluation[]> {
    const list = await api.getEvaluations();
    const target = list.find((item) => item.id === id);
    if (!target) return list;
    const updated: CandidateEvaluation = { ...target, status };
    await api.upsertEvaluation(updated);
    return list.map((item) => (item.id === id ? updated : item));
  },

  async deleteEvaluation(id: string): Promise<CandidateEvaluation[]> {
    await api.deleteEvaluation(id);
    return await api.getEvaluations();
  },

  // ---------------- 重置（清空后端并重灌示例数据） ----------------
  async resetAll() {
    const jds = await api.getJds();
    await Promise.all(jds.map((j) => api.deleteJd(j.id)));
    const evals = await api.getEvaluations();
    await Promise.all(evals.map((e) => api.deleteEvaluation(e.id)));

    await Promise.all(INITIAL_JDS.map((j) => api.upsertJd(j)));
    await Promise.all(INITIAL_EVALUATIONS.map((e) => api.upsertEvaluation(e)));

    // 重置本地认证态
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
    localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
  },
};
