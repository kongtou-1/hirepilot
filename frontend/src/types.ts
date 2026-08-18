export type UserRole = 'HR_DIRECTOR' | 'SENIOR_RECRUITER' | 'HIRING_MANAGER';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  roleTitle: string;
  department: string;
  company: string;
}

export type MatchLevel = 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'RISKY';
export type ScreeningStatus = 'NEW' | 'INVITED' | 'INTERVIEWING' | 'OFFERED' | 'REJECTED';
export type RecommendationType = '强烈推荐' | '建议初试' | '待定/储备' | '不匹配';

export interface DimensionScores {
  hardSkills: number; // 专业/技术硬技能契合度 (0-100)
  experienceMatch: number; // 业务与项目经验匹配度 (0-100)
  stabilityGrowth: number; // 稳定性与潜力 (0-100)
  compensationFit: number; // 职级与薪酬契合度 (0-100)
  softSkills: number; // 沟通协作/领导力 (0-100)
}

export interface InterviewQuestion {
  category: string;
  question: string;
  reason: string;
}

export interface OriginalFileMeta {
  token: string;   // 磁盘文件名，如 "a1b2c3.pdf"
  name: string;    // 原始展示名
  mime: string;
  size?: number;
}

export interface CandidateEvaluation {
  id: string;
  candidateName: string;
  appliedRole: string;
  targetJdId?: string;
  targetJdTitle?: string;
  experienceYears: number;
  education: string;
  currentCompany: string;
  currentRole: string;
  overallScore: number;
  matchLevel: MatchLevel;
  recommendation: RecommendationType;
  dimensionScores: DimensionScores;
  summary: string;
  keyHighlights: string[];
  potentialRisks: string[];
  recommendedQuestions: InterviewQuestion[];
  screeningDate: string;
  status: ScreeningStatus;
  rawResumeText?: string;
  originalFile?: OriginalFileMeta;
  evaluatorName?: string;
  aiModel?: string;
  notes?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  level: string;
  salaryRange: string;
  experience: string;
  education: string;
  location: string;
  workMode: string;
  oneSentencePitch: string;
  responsibilities: string[];
  requirements: string[];
  preferredSkills: string[];
  benefits: string[];
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  status: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  candidateCount?: number;
  version?: number;
}

export type ScreeningTaskStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface ScreeningTask {
  id: string;
  status: ScreeningTaskStatus;
  candidateName: string;
  appliedRole: string;
  position: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
  evaluationId?: string;
}

export type ActiveTab = 'overview' | 'resume-agent' | 'jd-agent' | 'history-reports';

export interface ScreeningReportExportOptions {
  includeRadar: boolean;
  includeQuestions: boolean;
  includeRawSummary: boolean;
  includeRisks: boolean;
  reportTitle: string;
  preparedBy: string;
  notes: string;
}
