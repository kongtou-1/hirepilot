"""LLM 状态与模型探测端点（帮助核实模型名是否可用）。"""
from __future__ import annotations

from urllib.parse import urlparse

from fastapi import APIRouter

from app.core.config import settings
from app.services import llm as llm_service

router = APIRouter(prefix="/api", tags=["llm"])


@router.get("/llm/status")
def llm_status() -> dict:
    base_host = ""
    try:
        base_host = urlparse(settings.llm_base_url).netloc
    except Exception:  # noqa: BLE001
        base_host = settings.llm_base_url
    return {
        "hasLlmKey": llm_service.llm_available(),
        "llmModel": settings.llm_model if llm_service.llm_available() else None,
        "llmBaseUrl": base_host or None,
        "llmStatus": "configured" if llm_service.llm_available() else "no-key",
    }


@router.get("/llm/models")
def llm_models() -> dict:
    """列出该端点可用模型，用于核实 LLM_MODEL 是否填写正确。"""
    if not llm_service.llm_available():
        return {"success": False, "error": "未配置 LLM_API_KEY，无法列出模型"}
    try:
        client = llm_service.get_client()
        models = client.models.list()
        ids = [m.id for m in models.data]
        return {"success": True, "models": ids}
    except Exception as e:  # noqa: BLE001
        return {"success": False, "error": str(e)}
