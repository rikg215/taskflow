"""Task endpoints — CRUD, complete, move, notes."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Task, TaskNote, Track
from app.schemas import TaskComplete, TaskCreate, TaskMove, TaskNoteOut, TaskOut, TaskUpdate

router = APIRouter(prefix="/api", tags=["tasks"])


def _task_out(task: Task) -> dict:
    return {
        "id": task.id,
        "track_id": task.track_id,
        "name": task.name,
        "description": task.description,
        "weight": task.weight,
        "status": task.status,
        "progress": task.progress,
        "total_steps": task.total_steps,
        "sort_order": task.sort_order,
        "column_name": task.column_name,
        "scheduled_day": task.scheduled_day,
        "completion_notes": task.completion_notes,
        "completed_at": task.completed_at,
        "notes": [
            {"id": n.id, "task_id": n.task_id, "content": n.content, "created_at": n.created_at}
            for n in sorted(task.notes or [], key=lambda n: n.created_at)
        ],
    }


@router.get("/tasks", response_model=list[TaskOut])
async def list_tasks(
    track_id: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(Task).options(selectinload(Task.notes))
    if track_id:
        q = q.where(Task.track_id == track_id)
    q = q.order_by(Task.sort_order)
    result = await db.execute(q)
    return [_task_out(t) for t in result.scalars().unique().all()]


@router.post("/tasks", response_model=TaskOut, status_code=201)
async def create_task(data: TaskCreate, db: AsyncSession = Depends(get_db)):
    track = await db.get(Track, data.track_id)
    if not track:
        raise HTTPException(404, "Track not found")
    # Determine sort_order: append to end of column
    existing = await db.execute(
        select(Task).where(Task.column_name == data.column_name).order_by(Task.sort_order.desc()).limit(1)
    )
    last = existing.scalar_one_or_none()
    next_order = (last.sort_order + 1) if last else 0

    task = Task(
        track_id=data.track_id,
        name=data.name,
        description=data.description,
        weight=data.weight,
        column_name=data.column_name,
        scheduled_day=data.scheduled_day,
        sort_order=next_order,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task, ["notes"])
    return _task_out(task)


@router.put("/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, data: TaskUpdate, db: AsyncSession = Depends(get_db)):
    task = await db.execute(select(Task).options(selectinload(Task.notes)).where(Task.id == task_id))
    task = task.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    update_data = data.model_dump(exclude_unset=True)
    append_note = update_data.pop("append_note", None)

    # Track completion state change
    was_complete = task.status == "complete"
    for key, val in update_data.items():
        setattr(task, key, val)
    is_complete = task.status == "complete"

    if not was_complete and is_complete and not task.completed_at:
        task.completed_at = datetime.now(timezone.utc)

    if append_note:
        note = TaskNote(task_id=task.id, content=append_note)
        db.add(note)

    await db.commit()
    await db.refresh(task, ["notes"])
    return _task_out(task)


@router.put("/tasks/{task_id}/complete", response_model=TaskOut)
async def complete_task(task_id: str, data: TaskComplete, db: AsyncSession = Depends(get_db)):
    task = await db.execute(select(Task).options(selectinload(Task.notes)).where(Task.id == task_id))
    task = task.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    task.status = "complete"
    task.completed_at = task.completed_at or datetime.now(timezone.utc)
    if data.completion_notes:
        task.completion_notes = data.completion_notes
    if task.column_name != "done":
        task.column_name = "done"
        # Append to end of done column
        existing = await db.execute(
            select(Task).where(Task.column_name == "done", Task.id != task_id)
            .order_by(Task.sort_order.desc()).limit(1)
        )
        last = existing.scalar_one_or_none()
        task.sort_order = (last.sort_order + 1) if last else 0

    await db.commit()
    await db.refresh(task, ["notes"])
    return _task_out(task)


@router.put("/tasks/{task_id}/move", response_model=TaskOut)
async def move_task(task_id: str, data: TaskMove, db: AsyncSession = Depends(get_db)):
    task = await db.execute(select(Task).options(selectinload(Task.notes)).where(Task.id == task_id))
    task = task.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Task not found")

    old_column = task.column_name
    new_column = data.column_name
    new_order = data.sort_order

    # Shift siblings in destination to open the slot
    siblings = await db.execute(
        select(Task).where(
            Task.column_name == new_column,
            Task.id != task_id,
            Task.sort_order >= new_order,
        )
    )
    for s in siblings.scalars().all():
        s.sort_order += 1

    task.column_name = new_column
    task.sort_order = new_order

    # Reindex old column if different
    if old_column != new_column:
        old_tasks = await db.execute(
            select(Task).where(Task.column_name == old_column).order_by(Task.sort_order)
        )
        for i, t in enumerate(old_tasks.scalars().all()):
            t.sort_order = i

    await db.commit()
    await db.refresh(task, ["notes"])
    return _task_out(task)


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(404, "Task not found")
    column = task.column_name
    await db.delete(task)
    await db.commit()
    # Reindex remaining tasks in the column
    remaining = await db.execute(
        select(Task).where(Task.column_name == column).order_by(Task.sort_order)
    )
    for i, t in enumerate(remaining.scalars().all()):
        t.sort_order = i
    await db.commit()
