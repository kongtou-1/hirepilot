"""通用 schema 与 AI 响应信封。"""
from __future__ import annotations

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiEnvelope(BaseModel, Generic[T]):
    """前端 AI 端点期望的响应信封：{ success, isAiLive, data }。"""

    success: bool = True
    isAiLive: bool = False
    data: T


def envelope(data: Any, is_ai_live: bool = False) -> dict:
    """构造 AI 端点响应字典（与前端 fetch 解析一致）。"""
    return {"success": True, "isAiLive": is_ai_live, "data": data}
