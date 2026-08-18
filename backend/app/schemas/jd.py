"""JobDescription Pydantic schema（camelCase 对齐前端 types.ts）。"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict

# camelCase 字段名 -> ORM snake_case 列名
JD_FIELD_MAP = {
    "id": "id",
    "title": "title",
    "department": "department",
    "level": "level",
    "salaryRange": "salary_range",
    "experience": "experience",
    "education": "education",
    "location": "location",
    "workMode": "work_mode",
    "oneSentencePitch": "one_sentence_pitch",
    "responsibilities": "responsibilities",
    "requirements": "requirements",
    "preferredSkills": "preferred_skills",
    "benefits": "benefits",
    "createdAt": "created_at",
    "updatedAt": "updated_at",
    "creatorName": "creator_name",
    "status": "status",
    "candidateCount": "candidate_count",
    "version": "version",
}
SNAKE_TO_CAMEL = {v: k for k, v in JD_FIELD_MAP.items()}


class JdModel(BaseModel):
    """JD 的创建/更新/读取载荷，字段与前端 JobDescription 一致。"""

    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str = ""
    department: str = ""
    level: str = ""
    salaryRange: str = ""
    experience: str = ""
    education: str = ""
    location: str = ""
    workMode: str = ""
    oneSentencePitch: str = ""
    responsibilities: list[str] = []
    requirements: list[str] = []
    preferredSkills: list[str] = []
    benefits: list[str] = []
    createdAt: str = ""
    updatedAt: str = ""
    creatorName: str = ""
    status: str = "DRAFT"
    candidateCount: int | None = None
    version: int | None = None


def jd_schema_to_orm(data: dict) -> dict:
    """将 camelCase 的 schema dict 转换为 ORM 列名 dict。"""
    return {JD_FIELD_MAP[k]: v for k, v in data.items() if k in JD_FIELD_MAP}


def orm_to_jd(obj) -> dict:
    """将 ORM 行对象转换为 camelCase 的响应 dict。"""
    return {camel: getattr(obj, snake) for snake, camel in SNAKE_TO_CAMEL.items()}
