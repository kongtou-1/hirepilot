"""FastAPI 应用入口：挂载 /api 路由 + 同源托管前端构建产物（dist/）。"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from app.core.config import settings
from app.core.database import Base, engine, init_db
from app.services.screening_queue import screening_queue


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时建表（幂等）
    init_db()
    # 启动简历筛选异步队列 worker
    screening_queue.start()
    try:
        yield
    finally:
        # 优雅停止 worker
        screening_queue.stop(timeout=5.0)


app = FastAPI(title="AI-HR Backend", version="0.1.0", lifespan=lifespan)

# 同源托管前端，开发期也允许跨域（vite dev 直连时）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- API 路由（优先注册，确保 /api 不被 SPA 兜底拦截） ----------------
from app.routers import evaluations, health, jd, llm, resume  # noqa: E402

app.include_router(health.router)
app.include_router(resume.router)
app.include_router(jd.router)
app.include_router(evaluations.router)
app.include_router(llm.router)


# ---------------- 同源托管前端 SPA ----------------
_DIST = settings.frontend_dist
_DIST_RESOLVED = _DIST.resolve()


def _serve_spa(request: Request):
    """返回 SPA 入口 index.html（所有非资源路由回退到此）。"""
    return FileResponse(_DIST / "index.html")


if _DIST.exists():
    # 静态资源（js/css/img 等）按真实文件路径返回；其余回退 index.html
    @app.get("/{full_path:path}")
    async def spa_catch_all(full_path: str, request: Request):
        target = (_DIST_RESOLVED / full_path).resolve()
        if (
            full_path
            and target.is_file()
            and _DIST_RESOLVED in target.parents
        ):
            return FileResponse(target)
        return _serve_spa(request)

else:
    # 前端尚未构建：开放 CORS 以便 `npm run dev` 跨域直连
    @app.get("/")
    async def dev_root():
        return {
            "status": "ok",
            "mode": "api-only",
            "hint": "前端未构建（frontend/dist 不存在）。"
            "请用 `npm run dev` 启动前端，或先 `npm run build`。",
        }
