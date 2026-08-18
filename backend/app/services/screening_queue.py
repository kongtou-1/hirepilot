"""简历筛选异步任务队列（内存实现）。

职责：
- 接收简历筛选请求，立即返回 task_id。
- 使用独立 worker 线程串行/限流执行 LLM 调用，避免打爆外部服务。
- 维护最近 N 条任务状态，支持查询任务进度与历史列表。
- 任务成功完成后自动写入 evaluations 表。
"""
from __future__ import annotations

import threading
import time
import uuid
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Optional

from app.core.config import settings
from app.core.database import SessionLocal
from app.schemas.evaluation import EvaluationModel, evaluation_schema_to_orm
from app.services import llm, mock_ai


@dataclass
class ScreeningTask:
    """单个筛选任务（camelCase 字段对齐前端）。"""

    id: str
    status: str  # pending / running / completed / failed
    candidate_name: str
    applied_role: str
    payload: dict[str, Any] = field(default_factory=dict)
    position: int = 0
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    evaluation_id: Optional[str] = None
    created_at: str = ""
    started_at: Optional[str] = None
    finished_at: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status,
            "candidateName": self.candidate_name,
            "appliedRole": self.applied_role,
            "position": self.position,
            "error": self.error,
            "evaluationId": self.evaluation_id,
            "createdAt": self.created_at,
            "startedAt": self.started_at,
            "finishedAt": self.finished_at,
        }


class ScreeningQueue:
    """内存任务队列：单例，线程安全。"""

    def __init__(self, workers: int = 1, keep: int = 50) -> None:
        self._workers = max(1, workers)
        self._keep = max(1, keep)
        self._pending: deque[ScreeningTask] = deque()
        self._tasks: dict[str, ScreeningTask] = {}
        self._lock = threading.Lock()
        self._stop_event = threading.Event()
        self._worker_threads: list[threading.Thread] = []

    def start(self) -> None:
        """启动 worker 线程。"""
        for i in range(self._workers):
            t = threading.Thread(
                target=self._worker_loop,
                name=f"screening-worker-{i}",
                daemon=True,
            )
            t.start()
            self._worker_threads.append(t)

    def stop(self, timeout: float = 5.0) -> None:
        """发送停止信号并等待 worker 退出。"""
        self._stop_event.set()
        for t in self._worker_threads:
            t.join(timeout=timeout)
        self._worker_threads.clear()

    def submit(self, payload: dict[str, Any]) -> ScreeningTask:
        """提交新任务并返回任务对象。"""
        now = _now_str()
        task = ScreeningTask(
            id=f"task-{uuid.uuid4().hex[:12]}",
            status="pending",
            candidate_name=(payload.get("candidateName") or "候选人").strip() or "候选人",
            applied_role=(payload.get("targetRole") or "核心岗位").strip() or "核心岗位",
            payload=payload,
            position=0,
            created_at=now,
        )
        with self._lock:
            self._pending.append(task)
            self._tasks[task.id] = task
            self._recompute_positions()
            self._trim_history()
        return task

    def get(self, task_id: str) -> Optional[ScreeningTask]:
        with self._lock:
            return self._tasks.get(task_id)

    def list_recent(self, limit: int = 50) -> list[ScreeningTask]:
        with self._lock:
            tasks = sorted(
                self._tasks.values(),
                key=lambda t: t.created_at,
                reverse=True,
            )
        return tasks[:limit]

    def _worker_loop(self) -> None:
        while not self._stop_event.is_set():
            task: Optional[ScreeningTask] = None
            with self._lock:
                if self._pending:
                    task = self._pending.popleft()
                    task.status = "running"
                    task.started_at = _now_str()
                    self._recompute_positions()

            if task is None:
                time.sleep(0.2)
                continue

            self._execute(task)

            # 执行完成后只更新状态；trim 在 submit 时处理
            with self._lock:
                self._trim_history()

    def _execute(self, task: ScreeningTask) -> None:
        payload = task.payload
        try:
            data = llm.generate_screening(
                candidate_name=payload.get("candidateName"),
                target_role=payload.get("targetRole"),
                experience_years=payload.get("experienceYears"),
                resume_text=payload.get("resumeText", ""),
                target_jd=payload.get("targetJd"),
            )
            is_ai_live = True
        except Exception as exc:  # noqa: BLE001
            try:
                data = mock_ai.generate_screening(
                    candidate_name=payload.get("candidateName"),
                    target_role=payload.get("targetRole"),
                    experience_years=payload.get("experienceYears"),
                    resume_text=payload.get("resumeText", ""),
                    target_jd=payload.get("targetJd"),
                )
                is_ai_live = False
            except Exception as mock_exc:  # noqa: BLE001
                with self._lock:
                    task.status = "failed"
                    task.error = f"AI 评估失败：{mock_exc}"
                    task.finished_at = _now_str()
                return

        data["aiModel"] = settings.llm_model

        evaluation = _build_evaluation(payload, data, is_ai_live)
        evaluation_id = _save_evaluation(evaluation)

        with self._lock:
            task.status = "completed"
            task.result = data
            task.evaluation_id = evaluation_id
            task.finished_at = _now_str()

    def _recompute_positions(self) -> None:
        """重新计算 pending 任务的排队位置（从 1 开始）。"""
        for idx, t in enumerate(self._pending):
            t.position = idx + 1
        for t in self._tasks.values():
            if t.status != "pending" and t.position > 0:
                t.position = 0

    def _trim_history(self) -> None:
        """只保留最近 N 条任务；若全部在运行则暂不删除。"""
        if len(self._tasks) <= self._keep:
            return

        # 按创建时间排序
        ordered = sorted(self._tasks.values(), key=lambda t: t.created_at)
        removable = [t for t in ordered if t.status in ("completed", "failed")]
        to_remove = len(self._tasks) - self._keep
        for t in removable[:to_remove]:
            self._tasks.pop(t.id, None)


# --------------------------------------------------------------------------- #
# 辅助函数
# --------------------------------------------------------------------------- #
def _now_str() -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())


def _build_evaluation(
    payload: dict[str, Any],
    raw: dict[str, Any],
    is_ai_live: bool,
) -> EvaluationModel:
    """把 LLM/mock 输出与原始 payload 组合为 CandidateEvaluation。"""
    from datetime import datetime

    candidate_name = raw.get("candidateName") or payload.get("candidateName") or "候选人"
    applied_role = raw.get("appliedRole") or payload.get("targetRole") or "核心岗位"
    experience_years = raw.get("experienceYears") or payload.get("experienceYears") or 0

    return EvaluationModel(
        id=f"eval-{uuid.uuid4().hex[:12]}",
        candidateName=candidate_name,
        appliedRole=applied_role,
        targetJdId=payload.get("targetJdId"),
        targetJdTitle=payload.get("targetJdTitle"),
        experienceYears=experience_years,
        education=raw.get("education", ""),
        currentCompany=raw.get("currentCompany", ""),
        currentRole=raw.get("currentRole", applied_role),
        overallScore=raw.get("overallScore", 0),
        matchLevel=raw.get("matchLevel", "GOOD"),
        recommendation=raw.get("recommendation", "建议初试"),
        dimensionScores=raw.get("dimensionScores", {}),
        summary=raw.get("summary", ""),
        keyHighlights=raw.get("keyHighlights", []),
        potentialRisks=raw.get("potentialRisks", []),
        recommendedQuestions=raw.get("recommendedQuestions", []),
        screeningDate=datetime.now().strftime("%Y-%m-%d %H:%M"),
        status="NEW",
        rawResumeText=payload.get("resumeText"),
        originalFile=payload.get("originalFile"),
        evaluatorName="Gemini 3.7 AI 引擎" if is_ai_live else "智聘AI 智能评估引擎",
        aiModel=settings.llm_model,
    )


def _save_evaluation(evaluation: EvaluationModel) -> str:
    """在 worker 线程中独立写入数据库，返回 evaluation id。"""
    from sqlalchemy.orm import Session

    db: Session = SessionLocal()
    try:
        data = evaluation_schema_to_orm(evaluation.model_dump())
        from app.models.evaluation import CandidateEvaluation

        obj = CandidateEvaluation(**data)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return str(obj.id)
    finally:
        db.close()


# --------------------------------------------------------------------------- #
# 模块级单例
# --------------------------------------------------------------------------- #
screening_queue = ScreeningQueue(
    workers=settings.screening_queue_workers,
    keep=settings.screening_task_keep,
)
