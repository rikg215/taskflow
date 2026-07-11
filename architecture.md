# TASKFLOW — Architecture & Design

## Overview

A Kubernetes-native KANBAN task tracker with health bars, drag-and-drop, completion notes, and Web Audio sound effects. The standardized system for managing project tracks, certification progress, and career goals.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   kubernetes namespace: taskflow                  │
│                                                                   │
│   ┌──────────────┐     ┌──────────────┐                           │
│   │  frontend     │────▶│  backend     │───┐                       │
│   │  React 18/TS  │     │  FastAPI      │   │                       │
│   │  Deployment   │     │  Deployment   │   │                       │
│   │  port 80      │     │  port 8080    │   │                       │
│   └──────┬───────┘     └──────┬───────┘   │                       │
│          │                    │           │                       │
│          ▼                    ▼           ▼                       │
│   ┌──────────────┐     ┌──────────────────────────┐               │
│   │  svc/frontend│     │  svc/backend              │               │
│   │  ClusterIP   │     │  ClusterIP                │               │
│   └──────────────┘     └──────────┬───────────────┘               │
│                                   │                               │
│                                   ▼                               │
│                          ┌──────────────┐                         │
│                          │  postgres    │                         │
│                          │  StatefulSet  │                         │
│                          │  port 5432   │                         │
│                          │  PVC: 5Gi    │                         │
│                          └──────────────┘                         │
│                                                                   │
│   ┌──────────────────────────────────────────────┐               │
│   │  ingress-nginx — taskflow.home (TLS)          │               │
│   │  /api → backend:8080    / → frontend:80      │               │
│   └──────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘

External:
  Browser ──▶ ingress → svc/frontend:80 (React SPA)
  API calls ──▶ ingress → svc/backend:8080 (FastAPI JSON API)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite 5, Tailwind CSS 3.4 |
| Drag & Drop | @hello-pangea/dnd (maintained fork of react-beautiful-dnd) |
| Animation | Framer Motion 11 |
| Icons | Lucide React |
| Backend | Python 3.13, FastAPI, SQLAlchemy 2.0 (async), asyncpg |
| Database | PostgreSQL 16 |
| Infra | Kubernetes (kubeadm, 6-node bare-metal), containerd |
| Ingress | ingress-nginx + cert-manager (TLS) |
| Containers | Docker multi-stage builds |

## Database Schema

```sql
CREATE TABLE tracks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(255) NOT NULL,
    category      VARCHAR(50) NOT NULL,  -- cert, project, course, side-quest, meta
    priority      INTEGER NOT NULL DEFAULT 5,
    target_date   DATE,
    status        VARCHAR(20) NOT NULL DEFAULT 'active',  -- active, shipped, archived
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tasks (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id      UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    name          VARCHAR(500) NOT NULL,
    description   TEXT,
    weight        INTEGER NOT NULL DEFAULT 1,
    status        VARCHAR(20) NOT NULL DEFAULT 'not-started',  -- not-started, in-progress, complete, blocked, skipped
    progress      INTEGER,
    total_steps   INTEGER,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    column_name   VARCHAR(20) NOT NULL DEFAULT 'backlog',  -- backlog, todo, in-progress, done
    scheduled_day DATE,
    completion_notes TEXT,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_notes (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tasks_track_id ON tasks(track_id);
CREATE INDEX idx_tasks_column ON tasks(column_name);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_scheduled_day ON tasks(scheduled_day);
CREATE INDEX idx_task_notes_task_id ON task_notes(task_id);
```

## KANBAN Columns

```
  BACKLOG          TODO          IN PROGRESS        DONE
  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
  │ task 1  │    │ task 5  │    │ task 8  │    │ task 10 │
  │ task 2  │    │ task 6  │    │ task 9  │    │ task 11 │
  │ task 3  │    │ task 7  │    └─────────┘    │ task 12 │
  │ task 4  │    └─────────┘                    └─────────┘
  └─────────┘
       ↕ drag-and-drop between any columns
```

Tasks are reordered within columns by `sort_order`. Dragging to the "Done" column auto-marks the task complete and records `completed_at` + optional `completion_notes`.

## Track Categories & Visual Identity

| Category | Color | Use |
|----------|-------|-----|
| `cert` | Blue (#3B82F6) | Certification tracks (CKA, SAA, CKS) |
| `project` | Emerald (#10B981) | Portfolio projects with ship dates |
| `course` | Violet (#8B5CF6) | Course-based learning tracks |
| `side-quest` | Amber (#F59E0B) | Experimental / optional work |
| `meta` | Slate (#64748B) | Career infrastructure (resume, job search) |

## Completion Calculation

Track completion is computed server-side:

```python
completion_percent = (completed_tasks_within_track / total_tasks_within_track) * 100
```

Task-level progress (optional) tracks steps: `progress / total_steps` displayed as a sub-bar on the task card.

## Sound Design

| Event | Audio |
|-------|-------|
| Task dropped (reorder) | Short triangle pluck |
| Task completed | 3-tone arpeggio (C5, F#5, B4) |
| Track fully completed | 6-tone celebratory fanfare |

All sounds use the Web Audio API (no external files). Toggle persisted in `localStorage` under key `taskflow.sound`.
