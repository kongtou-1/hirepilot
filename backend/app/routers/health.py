"""健康检查端点。"""
from __future__ import annotations

from urllib.parse import urlparse

from fastapi import APIRouter

from app.core.config import settings
from app.services import llm as llm_service

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
def health() -> dict:
    base_host = ""
    try:
        base_host = urlparse(settings.llm_base_url).netloc
    except Exception:  # noqa: BLE001
        base_host = settings.llm_base_url
    return {
        "status": "ok",
        "hasLlmKey": llm_service.llm_available(),
        "llmModel": settings.llm_model if llm_service.llm_available() else None,
        "llmBaseUrl": base_host or None,
    }
