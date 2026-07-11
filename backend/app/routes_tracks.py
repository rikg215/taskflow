"""Track endpoints."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Task, Track
from app.schemas import DashboardStats, TrackCreate, TrackOut

router = APIRouter(prefix="/api", tags=["tracks"])


def _track_out(track: Track) -> dict:
    tasks = track.tasks or []
    total = len(tasks)
    done = sum(1 for t in tasks if t.status == "complete")
    pct = round(done / total * 100) if total else 0
    return {
        "id": track.id,
        "name": track.name,
        "category": track.category,
        "priority": track.priority,
        "target_date": track.target_date,
        "status": track.status,
        "completion_percent": pct,
        "task_count": total,
        "completed_count": done,
    }


@router.get("/tracks", response_model=list[TrackOut])
async def list_tracks(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Track).options(selectinload(Track.tasks)).order_by(Track.priority))
    tracks = result.scalars().unique().all()
    return [_track_out(t) for t in tracks]


@router.post("/tracks", response_model=TrackOut, status_code=201)
async def create_track(data: TrackCreate, db: AsyncSession = Depends(get_db)):
    track = Track(**data.model_dump())
    db.add(track)
    await db.commit()
    await db.refresh(track, ["tasks"])
    return _track_out(track)


@router.delete("/tracks/{track_id}", status_code=204)
async def delete_track(track_id: str, db: AsyncSession = Depends(get_db)):
    track = await db.get(Track, track_id)
    if not track:
        from fastapi import HTTPException
        raise HTTPException(404, "Track not found")
    await db.delete(track)
    await db.commit()


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(db: AsyncSession = Depends(get_db)):
    tracks_result = await db.execute(select(Track).options(selectinload(Track.tasks)))
    tracks = tracks_result.scalars().unique().all()

    total_tasks = 0
    completed_tasks = 0
    for t in tracks:
        tasks = t.tasks or []
        total_tasks += len(tasks)
        completed_tasks += sum(1 for tk in tasks if tk.status == "complete")

    return {
        "total_tracks": len(tracks),
        "active_tracks": sum(1 for t in tracks if t.status == "active"),
        "shipped_tracks": sum(1 for t in tracks if t.status == "shipped"),
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "overall_percent": round(completed_tasks / total_tasks * 100) if total_tasks else 0,
    }
