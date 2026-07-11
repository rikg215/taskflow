"""Pydantic schemas — request/response models matching the frontend contract."""
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel


# ── Track ──────────────────────────────────────────────────────────────

class TrackOut(BaseModel):
    id: str
    name: str
    category: Literal["cert", "project", "course", "side-quest", "meta"]
    priority: int
    target_date: Optional[date] = None
    status: Literal["active", "shipped", "archived"]
    completion_percent: float
    task_count: int
    completed_count: int

    class Config:
        from_attributes = True


class TrackCreate(BaseModel):
    name: str
    category: Literal["cert", "project", "course", "side-quest", "meta"]
    priority: int = 5
    target_date: Optional[date] = None


# ── TaskNote ───────────────────────────────────────────────────────────

class TaskNoteOut(BaseModel):
    id: str
    task_id: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Task ───────────────────────────────────────────────────────────────

class TaskOut(BaseModel):
    id: str
    track_id: str
    name: str
    description: Optional[str] = None
    weight: int
    status: Literal["not-started", "in-progress", "complete", "blocked", "skipped"]
    progress: Optional[int] = None
    total_steps: Optional[int] = None
    sort_order: int
    column_name: Literal["backlog", "todo", "in-progress", "done"]
    scheduled_day: Optional[date] = None
    completion_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    notes: list[TaskNoteOut] = []

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    name: str
    description: Optional[str] = None
    track_id: str
    weight: int = 1
    column_name: Literal["backlog", "todo", "in-progress", "done"] = "backlog"
    scheduled_day: Optional[date] = None


class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    track_id: Optional[str] = None
    weight: Optional[int] = None
    status: Optional[Literal["not-started", "in-progress", "complete", "blocked", "skipped"]] = None
    progress: Optional[int] = None
    total_steps: Optional[int] = None
    sort_order: Optional[int] = None
    column_name: Optional[Literal["backlog", "todo", "in-progress", "done"]] = None
    scheduled_day: Optional[date] = None
    append_note: Optional[str] = None


class TaskComplete(BaseModel):
    completion_notes: Optional[str] = None


class TaskMove(BaseModel):
    column_name: Literal["backlog", "todo", "in-progress", "done"]
    sort_order: int


# ── Dashboard ──────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_tracks: int
    active_tracks: int
    shipped_tracks: int
    total_tasks: int
    completed_tasks: int
    overall_percent: float
