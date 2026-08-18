"""候选人评估 CRUD 端点。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import evaluation as evaluation_model
from app.schemas import evaluation as evaluation_schema
from app.services import file_store

router = APIRouter(prefix="/api", tags=["evaluations"])


@router.get("/evaluations")
def list_evaluations(db: Session = Depends(get_db)):
    rows = db.query(evaluation_model.CandidateEvaluation).all()
    return [evaluation_schema.orm_to_evaluation(r) for r in rows]


@router.post("/evaluations", status_code=status.HTTP_200_OK)
def upsert_evaluation(
    payload: evaluation_schema.EvaluationModel,
    db: Session = Depends(get_db),
):
    data = evaluation_schema.evaluation_schema_to_orm(payload.model_dump())
    obj = db.get(evaluation_model.CandidateEvaluation, data["id"])
    if obj is None:
        obj = evaluation_model.CandidateEvaluation(**data)
        db.add(obj)
    else:
        for key, value in data.items():
            setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return evaluation_schema.orm_to_evaluation(obj)


@router.get("/evaluations/{evaluation_id}")
def get_evaluation(evaluation_id: str, db: Session = Depends(get_db)):
    obj = db.get(evaluation_model.CandidateEvaluation, evaluation_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation_schema.orm_to_evaluation(obj)


@router.put("/evaluations/{evaluation_id}")
def update_evaluation(
    evaluation_id: str,
    payload: evaluation_schema.EvaluationModel,
    db: Session = Depends(get_db),
):
    obj = db.get(evaluation_model.CandidateEvaluation, evaluation_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    data = evaluation_schema.evaluation_schema_to_orm(payload.model_dump())
    for key, value in data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return evaluation_schema.orm_to_evaluation(obj)


@router.get("/evaluations/{evaluation_id}/file")
def get_evaluation_file(
    evaluation_id: str,
    download: bool = False,
    db: Session = Depends(get_db),
):
    obj = db.get(evaluation_model.CandidateEvaluation, evaluation_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    meta = obj.original_file
    if not meta or not meta.get("token"):
        raise HTTPException(status_code=404, detail="该记录无原始简历文件")
    try:
        path = file_store.resolve_upload_path(meta["token"])
    except ValueError:
        raise HTTPException(status_code=400, detail="无效的文件标识")
    if not path.exists():
        raise HTTPException(status_code=404, detail="原始文件不存在或已被清理")
    mime = meta.get("mime") or "application/octet-stream"
    disp = "attachment" if (download or mime not in file_store.PREVIEWABLE_MIME) else "inline"
    return FileResponse(
        path,
        media_type=mime,
        filename=meta.get("name"),
        content_disposition_type=disp,
    )


@router.delete("/evaluations/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evaluation(evaluation_id: str, db: Session = Depends(get_db)):
    obj = db.get(evaluation_model.CandidateEvaluation, evaluation_id)
    if obj is None:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    token = (obj.original_file or {}).get("token")
    db.delete(obj)
    db.commit()
    if token:
        # 引用计数：仅当无其他记录共享该 token 时才物理删除
        shared = False
        for other in db.query(evaluation_model.CandidateEvaluation).all():
            of = other.original_file
            if of and of.get("token") == token and other.id != evaluation_id:
                shared = True
                break
        if not shared:
            file_store.delete_upload(token)
    return None
