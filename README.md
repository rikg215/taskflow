# 🚀 TaskFlow — Personal Mission Control

> **A KANBAN-style task tracker with animated health bars, drag-and-drop, completion notes, and real-time progress visualization.**
>
> Deployed on a 6-node bare-metal Kubernetes cluster. Built in one day as a side-quest that became a flagship.

![Status: Shipped](https://img.shields.io/badge/status-shipped-success)
![Frontend: React](https://img.shields.io/badge/frontend-react_18-61DAFB?logo=react)
![Backend: FastAPI](https://img.shields.io/badge/backend-fastapi-009688?logo=fastapi)
![Database: PostgreSQL](https://img.shields.io/badge/db-postgresql_16-4169E1?logo=postgresql)
![Platform: Kubernetes](https://img.shields.io/badge/platform-kubernetes-326CE5?logo=kubernetes)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 What It Does

TaskFlow replaces scattered notes, spreadsheets, and mental tracking with a **single source of truth** for every project, certification, and career goal. It was built to manage:

- **12 active tracks** across certifications (CKA), courses (Ansible, Python), projects (k8s-kubeadm-lab, CI/CD), side-quests (Build-Your-Own-Container), and career (Job Search)
- **108+ tasks** with weights, scheduled dates, step progress, and completion notes
- A 4-column KANBAN board with full drag-and-drop reordering
- Animated health bars showing real-time completion percentages
- Web Audio API sound effects on task/track completion (with mute toggle)
- Dark-only theme with Framer Motion animations throughout

## 🏗 Architecture

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
```

## 🛠 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 18 + TypeScript + Tailwind CSS 3.4 + Vite 5 | Industry standard, type-safe, fast builds |
| **Drag & Drop** | @hello-pangea/dnd | Maintained fork of react-beautiful-dnd |
| **Animation** | Framer Motion 11 | Smooth KANBAN column transitions, card animations |
| **Icons** | Lucide React | Clean, consistent icon set |
| **Backend** | Python 3.13 + FastAPI + SQLAlchemy 2.0 | Async Python, automatic OpenAPI docs |
| **Database** | PostgreSQL 16 + asyncpg | Robust, k8s-native via StatefulSet |
| **Infra** | Kubernetes (kubeadm, 6-node bare-metal) | My CKA exam environment is my production environment |
| **Ingress** | ingress-nginx + cert-manager | TLS termination, path-based routing |
| **Containers** | Docker multi-stage builds | Small images (backend ~180MB, frontend ~50MB) |

## 📊 Database Schema

Three tables — tracks, tasks, and task_notes — with cascade deletes and proper indexing:

- **tracks** — the major objects (CKA Course, Ansible Fleet, Job Search, etc.) with category, priority, target date, and computed completion %
- **tasks** — subtasks within a track with weight, KANBAN column position, scheduled day, completion notes, and progress tracking (step X of Y)
- **task_notes** — free-form notes under any task for capturing context (paste errors, decisions, links)

Full schema in [`architecture.md`](architecture.md).

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/dashboard` | Aggregate stats (total tracks/tasks/completion %) |
| `GET` | `/api/tracks` | List all tracks with computed completion |
| `POST` | `/api/tracks` | Create a track |
| `PUT` | `/api/tracks/:id` | Update a track |
| `DELETE` | `/api/tracks/:id` | Delete a track (cascades to tasks) |
| `GET` | `/api/tasks` | List tasks (filter by `track_id`, `status`, `column_name`, `scheduled_day`) |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update any task field |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `PUT` | `/api/tasks/reorder` | Batch reorder tasks within a column (KANBAN drag) |
| `POST` | `/api/tasks/:id/notes` | Add a note to a task |
| `DELETE` | `/api/notes/:id` | Delete a note |

## 🚢 Deployment

### Prerequisites
- Kubernetes cluster (kubeadm, k3s, or any conformant distro)
- ingress-nginx controller
- cert-manager (for TLS) or a manually-provisioned TLS secret

### Quick Start

```bash
# 1. Apply all manifests in order
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-postgres-secret.yaml
kubectl apply -f k8s/02-postgres-pvc.yaml
kubectl apply -f k8s/03-postgres.yaml
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml
kubectl apply -f k8s/06-ingress.yaml

# 2. Wait for PostgreSQL to be ready
kubectl -n taskflow wait --for=condition=ready pod -l app=postgres --timeout=120s

# 3. Seed the database
kubectl -n taskflow run db-seed --rm -i --restart=Never --image=taskflow-backend:latest \
  --env="DATABASE_URL=$(kubectl -n taskflow get secret postgres-credentials -o jsonpath='{.data.DATABASE_URL}' | base64 -d)" \
  -- python3 /app/seed.py

# 4. Verify
curl -k https://taskflow.home/api/health
# → {"status":"ok"}

curl -k https://taskflow.home/api/tracks | jq '.[].name'
# → "CKA Course", "Ansible Fleet Project", ...
```

### Building From Source

```bash
# Backend
cd backend
docker build -t taskflow-backend:latest .

# Frontend
cd frontend
npm install && npm run build
docker build -t taskflow-frontend:latest .
```

## 🎨 Frontend Features

- **4-column KANBAN board:** Backlog → Todo → In Progress → Done
- **Drag-and-drop** between columns with instant API persistence
- **Task cards** show: weight bar, scheduled day badge (overdue/today/soon/future), completion notes indicator, notes count, step progress bar
- **Sidebar** with track list, mini health bars, and filtering (click a track to dim other tasks)
- **Task detail panel** (slide-in from right): full edit, notes thread, completion notes field
- **Health bars panel** — animated per-track progress bars for the big-picture view
- **Sound effects** using Web Audio API: drop pluck, task-complete arpeggio, track-complete fanfare (toggleable, persisted in localStorage)
- **Dark-only theme** — base `#0F1117` with blue/emerald accent gradients
- **`prefers-reduced-motion`** support
- **Custom scrollbars** — thin, dark, polished

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── seed.py                    # Database seed script
│   └── app/
│       ├── main.py                # FastAPI app entry
│       ├── config.py              # Settings (DATABASE_URL, etc.)
│       ├── database.py            # SQLAlchemy async engine + session
│       ├── models.py              # ORM models (Track, Task, TaskNote)
│       ├── schemas.py             # Pydantic request/response schemas
│       ├── routes_tracks.py       # /api/tracks endpoints
│       └── routes_tasks.py        # /api/tasks + /api/notes endpoints
├── frontend/
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── App.tsx                # Root component
│       ├── api.ts                 # API client (typed fetch wrapper)
│       ├── types.ts               # TypeScript interfaces
│       ├── sounds.ts              # Web Audio API sound effects
│       ├── hooks/
│       │   ├── useTaskFlow.ts     # Central state: tracks, tasks, CRUD, drag
│       │   └── useCountUp.ts      # Animated number counter
│       └── components/
│           ├── KanbanBoard.tsx    # 4-column drag-and-drop board
│           ├── KanbanColumn.tsx   # Single column with droppable zone
│           ├── TaskCard.tsx       # Draggable task card
│           ├── TaskDetailModal.tsx # Slide-in task detail panel
│           ├── AddTaskModal.tsx   # Create-task form
│           ├── AddTrackModal.tsx  # Create-track form
│           ├── Sidebar.tsx        # Track list + health bars
│           ├── TopBar.tsx         # Header with date, sound toggle, Add Task
│           ├── HealthBar.tsx      # Single animated progress bar
│           ├── HealthBarsPanel.tsx # All-track health overview
│           ├── Modal.tsx          # Reusable modal shell
│           ├── Markdown.tsx       # Lightweight markdown renderer
│           └── ui.tsx             # Button, Input, Select, Badge primitives
└── k8s/
    ├── 00-namespace.yaml
    ├── 01-postgres-secret.yaml
    ├── 02-postgres-pvc.yaml
    ├── 03-postgres.yaml
    ├── 04-backend.yaml
    ├── 05-frontend.yaml
    └── 06-ingress.yaml
```

## 🧠 Why This Matters

This project demonstrates the full DevOps loop on real infrastructure:

- **Infrastructure as Code** — every resource is a Kubernetes manifest, not a click
- **Container-native** — multi-stage Docker builds, private registry, image distribution across 6 nodes
- **Database operations** — PostgreSQL StatefulSet with PVC persistence, schema migrations, seed scripts
- **Networking** — ingress-nginx path routing, TLS termination via cert-manager, Pi-hole local DNS
- **API design** — RESTful, async Python, proper error handling, query parameter filtering
- **Frontend engineering** — TypeScript throughout, custom hooks, drag-and-drop, Web Audio API, accessibility
- **Debugging** — real-world troubleshooting across pods, services, containerd, and ingress

It's the kind of project that answers "what have you built?" in an interview with a live demo.

## 📝 License

MIT — use it, fork it, deploy it, learn from it.

---

*Built by [Ricky Ghuman](https://github.com/rikg215) — Army Veteran (25U Signal) → LFCS → Terraform Associate → CKA (Sep 2026).*
*This IS the portfolio piece.*
