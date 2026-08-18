"""JD 生成/微调 AI 端点 + JD CRUD 端点。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import jd as jd_model
from app.schemas import jd as jd_schema
from app.schemas.common import envelope
from app.services import llm, mock_ai

router = APIRouter(prefix="/api", tags=["jd"])


class GenerateRequest(BaseModel):
    jobTitle: str
    department: str | None = None
    seniority: str | None = None
    experienceLevel: str | None = None
    educationLevel: str | None = None
    salaryRange: str | None = None
    location: str | None = None
    workMode: str | None = None
    benefits: list[str] | None = None
    keySkills: str | None = None
    coreDutiesInput: str | None = None
    tone: str | None = None


class RefineRequest(BaseModel):
    currentJd: dict
    instruction: str


@router.post("/jd/generate")
def generate(req: GenerateRequest, db: Session = Depends(get_db)):
    if not req.jobTitle or not req.jobTitle.strip():
        raise HTTPException(status_code=400, detail="职位名称为必填项")
    try:
        data = llm.generate_jd(
            job_title=req.jobTitle,
            department=req.department,
            seniority=req.seniority,
            experience_level=req.experienceLevel,
            education_level=req.educationLevel,
            salary_range=req.salaryRange,
            key_skills=req.keySkills,
            core_duties_input=req.coreDutiesInput,
            work_mode=req.workMode,
            location=req.location,
            benefits=req.benefits,
            tone=req.tone,
        )
        return envelope(data, is_ai_live=True)
    except Exception:  # noqa: BLE001
        # 大模型不可用/失败 -> 优雅降级到 mock，保证前端拿到合法响应
        data = None
        return envelope(data, is_ai_live=False)


@router.post("/jd/refine")
def refine(req: RefineRequest, db: Session = Depends(get_db)):
    if not req.currentJd or not req.instruction:
        raise HTTPException(status_code=400, detail="缺少当前JD或修改指令")
    try:
        data = llm.refine_jd(req.currentJd, req.instruction)
        return envelope(data, is_ai_live=True)
    except Exception:  # noqa: BLE001
        data = mock_ai.refine_jd(req.currentJd, req.instruction)
        return envelope(data, is_ai_live=False)


# ---------------- JD CRUD ----------------


@router.get("/jds")
def list_jds(db: Session = Depends(get_db)):
    rows = db.query(jd_model.JobDescription).all()
    return [jd_schema.orm_to_jd(r) for r in rows]


@router.post("/jds", status_code=status.HTTP_200_OK)
def upsert_jd(payload: jd_schema.JdModel, db: Session = Depends(get_db)):
    data = jd_schema.jd_schema_to_orm(payload.model_dump())
    obj = db.get(jd_model.JobDescription, data["id"])
    if obj is None:
        obj = jd_model.JobDescription(**data)
        db.add(obj)
    else:
        for key, value in data.items():
            setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return jd_schema.orm_to_jd(obj)


@router.get("/jds/{jd_id}")
def get_jd(jd_id: str, db: Session = Depends(get_db)):
    obj = db.get(jd_model.JobDescription, jd_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="JD not found")
    return jd_schema.orm_to_jd(obj)


@router.put("/jds/{jd_id}")
def update_jd(jd_id: str, payload: jd_schema.JdModel, db: Session = Depends(get_db)):
    obj = db.get(jd_model.JobDescription, jd_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="JD not found")
    data = jd_schema.jd_schema_to_orm(payload.model_dump())
    for key, value in data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return jd_schema.orm_to_jd(obj)


@router.delete("/jds/{jd_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_jd(jd_id: str, db: Session = Depends(get_db)):
    obj = db.get(jd_model.JobDescription, jd_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="JD not found")
    db.delete(obj)
    db.commit()
    return None
