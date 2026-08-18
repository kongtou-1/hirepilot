"""CandidateEvaluation Pydantic schema（camelCase 对齐前端 types.ts）。"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict

# camelCase 字段名 -> ORM snake_case 列名
EVAL_FIELD_MAP = {
    "id": "id",
    "candidateName": "candidate_name",
    "appliedRole": "applied_role",
    "targetJdId": "target_jd_id",
    "targetJdTitle": "target_jd_title",
    "experienceYears": "experience_years",
    "education": "education",
    "currentCompany": "current_company",
    "currentRole": "current_role",
    "overallScore": "overall_score",
    "matchLevel": "match_level",
    "recommendation": "recommendation",
    "dimensionScores": "dimension_scores",
    "summary": "summary",
    "keyHighlights": "key_highlights",
    "potentialRisks": "potential_risks",
    "recommendedQuestions": "recommended_questions",
    "screeningDate": "screening_date",
    "status": "status",
    "rawResumeText": "raw_resume_text",
    "originalFile": "original_file",
    "evaluatorName": "evaluator_name",
    "aiModel": "ai_model",
    "notes": "notes",
}
SNAKE_TO_CAMEL = {v: k for k, v in EVAL_FIELD_MAP.items()}


class EvaluationModel(BaseModel):
    """候选人评估的创建/更新/读取载荷，字段与前端 CandidateEvaluation 一致。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    candidateName: str = ""
    appliedRole: str = ""
    targetJdId: str | None = None
    targetJdTitle: str | None = None
    experienceYears: int = 0
    education: str = ""
    currentCompany: str = ""
    currentRole: str = ""
    overallScore: int = 0
    matchLevel: str = "GOOD"
    recommendation: str = "建议初试"
    dimensionScores: dict = {}
    summary: str = ""
    keyHighlights: list[str] = []
    potentialRisks: list[str] = []
    recommendedQuestions: list[dict] = []
    screeningDate: str = ""
    status: str = "NEW"
    rawResumeText: str | None = None
    originalFile: dict | None = None
    evaluatorName: str | None = None
    aiModel: str | None = None
    notes: str | None = None


def evaluation_schema_to_orm(data: dict) -> dict:
    return {EVAL_FIELD_MAP[k]: v for k, v in data.items() if k in EVAL_FIELD_MAP}


def orm_to_evaluation(obj) -> dict:
    return {camel: getattr(obj, snake) for snake, camel in SNAKE_TO_CAMEL.items()}
