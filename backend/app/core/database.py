"""SQLAlchemy 同步引擎、会话与建表逻辑。"""
from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings

# SQLite 需要 check_same_thread=False 以在 FastAPI 线程池中复用连接
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。"""


def migrate_db() -> None:
    """SQLite 轻量迁移：为旧表补齐新增列。"""
    with engine.connect() as conn:
        cols = {
            r[1] for r in conn.execute(text("PRAGMA table_info(evaluations)")).fetchall()
        }
        if "original_file" not in cols:
            conn.execute(text("ALTER TABLE evaluations ADD COLUMN original_file TEXT"))
            conn.commit()


def init_db() -> None:
    """创建所有表（幂等）并执行迁移。在应用启动时调用一次。"""
    # 导入模型以确保其被注册到 Base.metadata
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    migrate_db()

    # 首次建库（两表均空）时灌入示例数据，还原原前端首屏演示体验
    from app.core.seed import seed_if_empty

    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI 依赖：提供请求级数据库会话。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
