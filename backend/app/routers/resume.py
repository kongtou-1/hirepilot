"""简历初筛 AI 端点。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import BaseModel

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.common import envelope
from app.services import document_extract, file_store, llm, mock_ai, screening_queue

router = APIRouter(prefix="/api", tags=["resume"])


class OriginalFileMeta(BaseModel):
    token: str
    name: str
    mime: str
    size: int | None = None


class ScreenRequest(BaseModel):
    resumeText: str
    candidateName: str | None = None
    targetRole: str | None = None
    targetJd: str | None = None
    experienceYears: int | None = None
    originalFile: OriginalFileMeta | None = None


@router.post("/resume/screen")
def screen(req: ScreenRequest, db: Session = Depends(get_db)):
    if not req.resumeText or not req.resumeText.strip():
        raise HTTPException(status_code=400, detail="请提供简历内容进行分析")
    try:
        data = llm.generate_screening(
            candidate_name=req.candidateName,
            target_role=req.targetRole,
            experience_years=req.experienceYears,
            resume_text=req.resumeText,
            target_jd=req.targetJd,
        )
        data["aiModel"] = settings.llm_model
        return envelope(data, is_ai_live=True)
    except Exception:  # noqa: BLE001
        # 大模型不可用/失败 -> 优雅降级到 mock，保证前端拿到合法响应
        data = mock_ai.generate_screening(
            candidate_name=req.candidateName,
            target_role=req.targetRole,
            experience_years=req.experienceYears,
            resume_text=req.resumeText,
            target_jd=req.targetJd,
        )
        return envelope(data, is_ai_live=False)


class ExtractResult(BaseModel):
    text: str
    pages: int
    fileName: str
    charCount: int
    warning: str | None = None
    fileToken: str | None = None
    mimeType: str | None = None
    fileSize: int | None = None


@router.post("/resume/extract", response_model=None)
def extract_resume(file: UploadFile = File(...)) -> dict:
    """上传简历文档（PDF/Word/纯文本），服务端提取纯文本并落盘原始文件。

    前端把提取出的文本作为 resumeText、把 fileToken 等元数据作为 originalFile
    传给 /api/resume/screen。
    """
    content = file.file.read()  # 同步读取底层临时文件，适配同步端点
    if len(content) > settings.max_upload_size:
        raise HTTPException(status_code=413, detail="文件过大，请联系管理员或压缩后重试")
    try:
        result = document_extract.extract_text(file.filename or "", content)
    except document_extract.ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))

    try:
        meta = file_store.save_upload(content, file.filename or "resume")
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    data: ExtractResult = ExtractResult(
        text=result.text,
        pages=result.pages,
        fileName=result.fileName,
        charCount=result.charCount,
        warning=result.warning,
        fileToken=meta["token"],
        mimeType=meta["mime"],
        fileSize=meta["size"],
    )
    return envelope(data.model_dump(), is_ai_live=True)


class AsyncScreenResponse(BaseModel):
    id: str
    status: str
    candidateName: str
    appliedRole: str
    position: int
    createdAt: str


@router.post("/resume/screen/async")
def screen_async(req: ScreenRequest):
    """异步提交简历筛选任务，立即返回 task_id 供前端轮询。"""
    if not req.resumeText or not req.resumeText.strip():
        raise HTTPException(status_code=400, detail="请提供简历内容进行分析")

    payload = req.model_dump()
    task = screening_queue.screening_queue.submit(payload)
    return envelope(
        AsyncScreenResponse(**task.to_dict()).model_dump(), is_ai_live=True
    )


@router.get("/resume/screen/tasks/{task_id}")
def get_screen_task(task_id: str):
    """查询单个任务的进度与结果。"""
    task = screening_queue.screening_queue.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="任务不存在或已过期")
    return envelope(task.to_dict(), is_ai_live=True)


@router.get("/resume/screen/tasks")
def list_screen_tasks(limit: int = 50):
    """返回最近提交的筛选任务列表（内存存储，重启清空）。"""
    tasks = screening_queue.screening_queue.list_recent(limit=limit)
    return envelope([t.to_dict() for t in tasks], is_ai_live=True)
