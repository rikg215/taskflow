"""SQLAlchemy models — mirrors the frontend TypeScript types exactly."""
import uuid
from datetime import date, datetime

from sqlalchemy import (
    Column, Date, DateTime, ForeignKey, Integer, String, Text, func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


def gen_uuid():
    return str(uuid.uuid4())


class Track(Base):
    __tablename__ = "tracks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # cert, project, course, side-quest, meta
    priority = Column(Integer, nullable=False, default=5)
    target_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, shipped, archived
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    tasks = relationship("Task", back_populates="track", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    track_id = Column(String(36), ForeignKey("tracks.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Integer, nullable=False, default=1)
    status = Column(String(20), nullable=False, default="not-started")
    progress = Column(Integer, nullable=True)
    total_steps = Column(Integer, nullable=True)
    sort_order = Column(Integer, nullable=False, default=0)
    column_name = Column(String(20), nullable=False, default="backlog")
    scheduled_day = Column(Date, nullable=True)
    completion_notes = Column(Text, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    track = relationship("Track", back_populates="tasks")
    notes = relationship("TaskNote", back_populates="task", cascade="all, delete-orphan")


class TaskNote(Base):
    __tablename__ = "task_notes"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    task_id = Column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    task = relationship("Task", back_populates="notes")
