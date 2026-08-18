"""应用配置（读取 .env，提供数据库路径与服务端口）。"""
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# 加载 backend/ 目录下的 .env（config.py 位于 backend/app/core/，需上三级到 backend/）
_BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BACKEND_ROOT / ".env")


class Settings:
    """集中式配置。"""

    def __init__(self) -> None:
        self.backend_root: Path = _BACKEND_ROOT
        self.port: int = int(os.getenv("PORT", "8000"))

        # 数据库文件：相对 backend/ 目录，默认 data/hr.db
        db_path = os.getenv("DATABASE_PATH", "data/hr.db")
        db_file = Path(db_path)
        if not db_file.is_absolute():
            db_file = _BACKEND_ROOT / db_file
        db_file.parent.mkdir(parents=True, exist_ok=True)
        self.database_url: str = f"sqlite:///{db_file.as_posix()}"
        self.db_file_path: Path = db_file

        # 前端构建产物目录（由 `npm run build` 产出）
        self.frontend_dist: Path = _BACKEND_ROOT.parent / "frontend" / "dist"

        # 当前为纯 Mock 模式，无外部 AI key（保留以兼容旧配置）
        self.gemini_api_key: str | None = os.getenv("GEMINI_API_KEY") or None

        # 真实大模型（OpenAI 兼容端点）配置
        self.llm_api_key: str | None = os.getenv("LLM_API_KEY") or None
        self.llm_base_url: str = os.getenv("LLM_BASE_URL", "https://xuseny.online/v1")
        self.llm_model: str = os.getenv("LLM_MODEL", "gpt-5.5")
        self.llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.7"))
        self.llm_timeout: float = float(os.getenv("LLM_TIMEOUT", "60"))
        self.llm_max_retries: int = int(os.getenv("LLM_MAX_RETRIES", "2"))

        # 简历筛选异步队列配置
        self.screening_queue_workers: int = int(
            os.getenv("SCREENING_QUEUE_WORKERS", "1")
        )
        self.screening_task_keep: int = int(os.getenv("SCREENING_TASK_KEEP", "50"))

        # 原始简历文件存储目录（默认仓库根 uploads/，可经 UPLOAD_DIR 覆盖）
        upload_dir = os.getenv("UPLOAD_DIR", "")
        up = Path(upload_dir) if upload_dir else _BACKEND_ROOT.parent / "uploads"
        if not up.is_absolute():
            up = _BACKEND_ROOT / up
        up.mkdir(parents=True, exist_ok=True)
        self.upload_dir: Path = up

        # 简历上传体积上限（字节），默认 10MB
        self.max_upload_size: int = int(
            os.getenv("MAX_UPLOAD_SIZE", str(10 * 1024 * 1024))
        )


settings = Settings()
