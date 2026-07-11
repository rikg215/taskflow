# 🚀 TaskFlow v2.0 — Personal Mission Control

> **KANBAN board + Runway timeline + BurnChart telemetry. Dual-view task tracker with velocity tracking, drag-to-reschedule, and Web Audio sound effects.**
>
> Deployed on a 6-node bare-metal Kubernetes cluster. Built as a side-quest that became the flagship portfolio piece.

![Status: Shipped](https://img.shields.io/badge/status-shipped-success)
![Version: 2.0](https://img.shields.io/badge/version-2.0-blue)
![Frontend: React](https://img.shields.io/badge/frontend-react_18-61DAFB?logo=react)
![Backend: FastAPI](https://img.shields.io/badge/backend-fastapi-009688?logo=fastapi)
![Database: PostgreSQL](https://img.shields.io/badge/db-postgresql_16-4169E1?logo=postgresql)
![Platform: Kubernetes](https://img.shields.io/badge/platform-kubernetes-326CE5?logo=kubernetes)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

---

## What's New in v2.0

| Feature | Description |
|---------|-------------|
| **🏃 Runway View** | Gantt-style timeline with drag-to-reschedule, weight-proportional blocks, sub-row packing, zoom levels (S/M/L), NOW scanline, weekend shading, per-lane target date markers |
| **📊 BurnChart** | Animated SVG cumulative burn-up chart per track — 56-day lookback + velocity projection to target date |
| **📡 Telemetry Engine** | 21-day rolling velocity (tasks/week), ETA projection, margin calculation, intercept states (nominal/caution/behind/stalled/idle/shipped), 8-week sparklines |
| **🔄 View Toggle** | KANBAN ↔ Runway, persisted in localStorage |
| **🎯 Holding Pattern** | Unscheduled tasks parked at the bottom with auto-"slot" button that assigns to the earliest open day (max 2/day per track) |
| **🎨 Green Theme** | Color palette shifted to green-tinted dark theme |

## View Modes

### 🏃 Runway (Timeline View)
```
 JUL 7      JUL 8      JUL 9      JUL 10     JUL 11     JUL 12     JUL 13
   │          │          │          │    NOW   │          │          │
━━━┿━━━━━━━━━━┿━━━━━━━━━━┿━━━━━━━━━━┿━━━━╋━━━━━┿━━━━━━━━━━┿━━━━━━━━━━┿━━━━━
 CKA ┊[Networking]══╗  ┊[Service Net] ┊          ┊ [Ingress═══════════╗
     ┊              ║  ┊[DNS+CoreDNS] ┊          ┊                    ║
     ┊              ╚══╝              ┊          ┊                    ╚══
 ANS ┊                               ┊          ┊ [Handlers+Roles]
     ┊                               ┊          ┊
```

- **Drag blocks horizontally** to reschedule tasks
- **Click the checkmark** to mark complete inline
- **Block width** scales with task weight (1-5)
- **Red glow** = overdue, **green strikethrough** = done
- **Target icons** mark track deadlines on each lane

### 📋 KANBAN (Board View)
```
  BACKLOG          TODO          IN PROGRESS        DONE
  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
  │ task 1  │    │ task 5  │    │ task 8  │    │ task 10 │
  │ task 2  │    │ task 6  │    │ task 9  │    │ task 11 │
  └─────────┘    └─────────┘    └─────────┘    └─────────┘
       ↕ drag-and-drop between columns
```

- Classic 4-column KANBAN with full drag-and-drop
- Task cards show weight bar, scheduled day badge, progress, notes count
- Dragging to "Done" auto-completes

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   kubernetes namespace: taskflow                  │
│                                                                   │
│   ┌──────────────┐     ┌──────────────┐                           │
│   │  frontend     │────▶│  backend     │───┐                       │
│   │  React 18/TS  │     │  FastAPI      │   │                       │
│   │  port 80      │     │  port 8080    │   │                       │
│   └──────────────┘     └──────┬───────┘   │                       │
│                               │           ▼                       │
│                               │    ┌──────────────┐               │
│                               │    │  postgres    │               │
│                               └───▶│  :5432       │               │
│                                    └──────────────┘               │
│   ┌──────────────────────────────────────────────┐               │
│   │  ingress-nginx — taskflow.home (TLS)          │               │
│   └──────────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS 3.4 + Vite 5 |
| **Drag & Drop** | @hello-pangea/dnd |
| **Animation** | Framer Motion 11 |
| **Icons** | Lucide React |
| **Charts** | Hand-rolled SVG (BurnChart) |
| **Backend** | Python 3.13 + FastAPI + SQLAlchemy 2.0 (async) + asyncpg |
| **Database** | PostgreSQL 16 (StatefulSet, 5Gi PVC) |
| **Infra** | Kubernetes (kubeadm, 6-node bare-metal), containerd |
| **Ingress** | ingress-nginx + cert-manager |
| **Containers** | Docker multi-stage builds |

## Telemetry Engine

The `telemetry.ts` module powers both the Runway and BurnChart views:

| Metric | Calculation |
|--------|-------------|
| **Velocity** | Tasks completed in last 21 days ÷ 3 (tasks/week) |
| **ETA** | Remaining tasks ÷ daily velocity → projected completion date |
| **Margin** | Target date − ETA (positive = ahead, negative = behind) |
| **Sparkline** | Per-week completions over past 8 weeks |
| **Intercept State** | `nominal` / `caution` (≤7d behind) / `behind` / `stalled` / `idle` / `shipped` |

### Intercept States

```
  SHIPPED  ████████████████████▓▓▓▓▓▓▓▓▓▓  DONE
  NOMINAL  ██████████████░░░░░░░░░░░▓▓▓▓▓  ON TRACK
  CAUTION  ██████████░░░░░░░░░░░░░░░░░▓▓▓  ≤7 DAYS BEHIND
  BEHIND   ██████░░░░░░░░░░░░░░░░░░░░░░▓▓  BEHIND SCHEDULE
  STALLED  ██████░░░░░░░░░░░░░░░░░░░░░░░░  VELOCITY = 0
  IDLE     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  NOT YET STARTED
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard` | Aggregate stats |
| `GET/POST` | `/api/tracks` | List / Create tracks |
| `PUT/DELETE` | `/api/tracks/:id` | Update / Delete track |
| `GET/POST` | `/api/tasks` | List / Create tasks (filter by track, status, column, day) |
| `PUT/DELETE` | `/api/tasks/:id` | Update / Delete task |
| `POST` | `/api/tasks/:id/notes` | Add note to task |
| `GET` | `/api/health` | Health check |

## Project Structure

```
taskflow/
├── README.md
├── LICENSE
├── architecture.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── seed.py
│   └── app/
│       ├── main.py              # FastAPI entry
│       ├── config.py            # Settings
│       ├── database.py          # SQLAlchemy async engine
│       ├── models.py            # ORM models
│       ├── schemas.py           # Pydantic schemas
│       ├── routes_tracks.py     # /api/tracks
│       └── routes_tasks.py      # /api/tasks + notes
├── frontend/
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx              # Root + view toggle
│       ├── api.ts               # Typed fetch wrapper
│       ├── types.ts             # TypeScript interfaces
│       ├── sounds.ts            # Web Audio API sound effects
│       ├── telemetry.ts         # Velocity, ETA, intercept math
│       ├── hooks/
│       │   ├── useTaskFlow.ts   # Central state
│       │   └── useCountUp.ts    # Animated counters
│       └── components/
│           ├── RunwayBoard.tsx   # ★ v2.0: timeline + drag-to-reschedule
│           ├── BurnChart.tsx     # ★ v2.0: SVG cumulative burn-up
│           ├── KanbanBoard.tsx   # 4-column drag-and-drop
│           ├── KanbanColumn.tsx
│           ├── TaskCard.tsx
│           ├── TaskDetailModal.tsx
│           ├── AddTaskModal.tsx
│           ├── AddTrackModal.tsx
│           ├── Sidebar.tsx
│           ├── TopBar.tsx        # View toggle + sound toggle
│           ├── HealthBar.tsx
│           └── ui.tsx
└── k8s/
    ├── 00-namespace.yaml
    ├── 01-postgres-secret.yaml
    ├── 02-postgres-pvc.yaml
    ├── 03-postgres.yaml
    ├── 04-backend.yaml
    ├── 05-frontend.yaml
    └── 06-ingress.yaml
```

## Sound Design

| Event | Audio (Web Audio API) |
|-------|----------------------|
| Task dropped (reorder) | Triangle pluck |
| Task completed | 3-tone arpeggio (C5, F#5, B4) |
| Track fully completed | 6-tone celebratory fanfare |

Mute toggle persisted in `localStorage` (`taskflow.sound`).

## Why This Matters

This project demonstrates the full DevOps loop on real infrastructure:

- **Real k8s** — 6-node bare-metal cluster, not minikube
- **Real database** — PostgreSQL StatefulSet with PVC persistence
- **Real networking** — ingress-nginx, cert-manager TLS, Pi-hole local DNS
- **Real containers** — multi-stage Docker builds, containerd image distribution across nodes
- **Real telemetry** — rolling velocity, ETA projection, intercept states (not just CRUD)
- **Real UI complexity** — dual view modes, pointer-event drag scheduling, SVG charting, Web Audio API
- **Real portfolio** — 12 active tracks, 108+ tasks, tracking actual certification and project progress

---

*Built by [Ricky Ghuman](https://github.com/rikg215) — Army Veteran (25U Signal) → LFCS → Terraform Associate → CKA (Sep 2026).*
*This IS the portfolio piece.*
