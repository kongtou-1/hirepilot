"""CandidateEvaluation ORM 模型（对应前端 CandidateEvaluation）。"""
from __future__ import annotations

from sqlalchemy import Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CandidateEvaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    candidate_name: Mapped[str] = mapped_column("candidate_name", String, default="")
    applied_role: Mapped[str] = mapped_column("applied_role", String, default="")
    target_jd_id: Mapped[str | None] = mapped_column("target_jd_id", String, nullable=True)
    target_jd_title: Mapped[str | None] = mapped_column("target_jd_title", String, nullable=True)
    experience_years: Mapped[int] = mapped_column("experience_years", Integer, default=0)
    education: Mapped[str] = mapped_column(String, default="")
    current_company: Mapped[str] = mapped_column("current_company", String, default="")
    current_role: Mapped[str] = mapped_column("current_role", String, default="")
    overall_score: Mapped[int] = mapped_column("overall_score", Integer, default=0)
    match_level: Mapped[str] = mapped_column("match_level", String, default="GOOD")
    recommendation: Mapped[str] = mapped_column(String, default="建议初试")
    summary: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="NEW")
    screening_date: Mapped[str] = mapped_column("screening_date", String, default="")

    dimension_scores: Mapped[dict] = mapped_column("dimension_scores", JSON, default=dict)
    key_highlights: Mapped[list] = mapped_column("key_highlights", JSON, default=list)
    potential_risks: Mapped[list] = mapped_column("potential_risks", JSON, default=list)
    recommended_questions: Mapped[list] = mapped_column("recommended_questions", JSON, default=list)

    raw_resume_text: Mapped[str | None] = mapped_column("raw_resume_text", String, nullable=True)
    original_file: Mapped[dict | None] = mapped_column("original_file", JSON, nullable=True)
    evaluator_name: Mapped[str | None] = mapped_column("evaluator_name", String, nullable=True)
    ai_model: Mapped[str | None] = mapped_column("ai_model", String, nullable=True)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
