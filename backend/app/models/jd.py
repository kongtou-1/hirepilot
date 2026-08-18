"""JobDescription ORM 模型（对应前端 JobDescription）。"""
from __future__ import annotations

from sqlalchemy import Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    title: Mapped[str] = mapped_column(String, default="")
    department: Mapped[str] = mapped_column(String, default="")
    level: Mapped[str] = mapped_column(String, default="")
    salary_range: Mapped[str] = mapped_column("salary_range", String, default="")
    experience: Mapped[str] = mapped_column(String, default="")
    education: Mapped[str] = mapped_column(String, default="")
    location: Mapped[str] = mapped_column(String, default="")
    work_mode: Mapped[str] = mapped_column("work_mode", String, default="")
    one_sentence_pitch: Mapped[str] = mapped_column("one_sentence_pitch", String, default="")
    status: Mapped[str] = mapped_column(String, default="DRAFT")
    creator_name: Mapped[str] = mapped_column("creator_name", String, default="")

    responsibilities: Mapped[list] = mapped_column(JSON, default=list)
    requirements: Mapped[list] = mapped_column(JSON, default=list)
    preferred_skills: Mapped[list] = mapped_column("preferred_skills", JSON, default=list)
    benefits: Mapped[list] = mapped_column(JSON, default=list)

    candidate_count: Mapped[int | None] = mapped_column("candidate_count", Integer, nullable=True)
    version: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # 前端使用字符串时间戳，格式 "YYYY-MM-DD HH:mm"
    created_at: Mapped[str] = mapped_column("created_at", String, default="")
    updated_at: Mapped[str] = mapped_column("updated_at", String, default="")
