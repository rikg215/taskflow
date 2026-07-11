"""Seed the database with initial tracks and tasks from the v5.1 schedule.
Run after the backend starts: python seed.py
"""
import asyncio
from datetime import date, datetime, timezone

from app.database import async_session, engine, init_db
from app.models import Base, Task, Track


SEED_TRACKS = [
    {"id": "1", "name": "CKA Course", "category": "cert", "priority": 1, "target_date": date(2026, 9, 25), "status": "active"},
    {"id": "2", "name": "Ansible Course", "category": "course", "priority": 2, "target_date": date(2026, 7, 20), "status": "active"},
    {"id": "3", "name": "Python for DevOps", "category": "course", "priority": 3, "target_date": None, "status": "active"},
    {"id": "4", "name": "Ansible Fleet Project", "category": "project", "priority": 2, "target_date": date(2026, 7, 20), "status": "active"},
    {"id": "5", "name": "CI/CD Pipeline", "category": "project", "priority": 3, "target_date": date(2026, 7, 27), "status": "active"},
    {"id": "6", "name": "Hybrid Inference Gateway", "category": "side-quest", "priority": 5, "target_date": None, "status": "active"},
    {"id": "7", "name": "Job Search", "category": "meta", "priority": 1, "target_date": None, "status": "active"},
    {"id": "8", "name": "AWS 3-Tier Project", "category": "project", "priority": 1, "target_date": date(2026, 7, 9), "status": "shipped"},
]

SEED_TASKS = [
    # CKA — backlog
    {"id": "t07", "track_id": "1", "name": "Network Policies + LAB", "weight": 2, "status": "not-started", "sort_order": 0, "column_name": "backlog"},
    {"id": "t08", "track_id": "1", "name": "kubeadm cluster upgrade drill", "weight": 2, "status": "not-started", "sort_order": 1, "column_name": "backlog"},
    {"id": "t09", "track_id": "1", "name": "ETCD backup & restore drill", "weight": 2, "status": "not-started", "sort_order": 2, "column_name": "backlog"},
    {"id": "t10", "track_id": "1", "name": "Mock Exam 1 (killer.sh)", "weight": 5, "status": "not-started", "sort_order": 3, "column_name": "backlog", "scheduled_day": date(2026, 7, 19)},
    # CKA — todo
    {"id": "t03", "track_id": "1", "name": "Service Networking (08:51) + LAB", "weight": 3, "status": "not-started", "sort_order": 0, "column_name": "todo", "scheduled_day": date(2026, 7, 10)},
    {"id": "t04", "track_id": "1", "name": "DNS in k8s + CoreDNS + LAB", "weight": 3, "status": "not-started", "sort_order": 1, "column_name": "todo", "scheduled_day": date(2026, 7, 10)},
    {"id": "t05", "track_id": "1", "name": "Ingress (22:34) + article + annotations", "weight": 3, "status": "not-started", "sort_order": 2, "column_name": "todo"},
    {"id": "t06", "track_id": "1", "name": "Gateway API intro + practical + LAB", "weight": 3, "status": "not-started", "sort_order": 3, "column_name": "todo"},
    # CKA — in-progress
    {"id": "t01", "track_id": "1", "name": "Networking module (22/35 lessons)", "weight": 8, "status": "in-progress", "sort_order": 0, "column_name": "in-progress", "progress": 22, "total_steps": 35},
    # CKA — done
    {"id": "t02", "track_id": "1", "name": "Application Lifecycle Management", "weight": 5, "status": "complete", "sort_order": 0, "column_name": "done", "completed_at": datetime(2026, 7, 8, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t11", "track_id": "1", "name": "Cluster Maintenance module", "weight": 4, "status": "complete", "sort_order": 1, "column_name": "done", "completed_at": datetime(2026, 7, 7, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t12", "track_id": "1", "name": "Scheduling module", "weight": 3, "status": "complete", "sort_order": 2, "column_name": "done", "completed_at": datetime(2026, 7, 5, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t13", "track_id": "1", "name": "Resource Management module", "weight": 3, "status": "complete", "sort_order": 3, "column_name": "done", "completed_at": datetime(2026, 7, 3, 12, 0, 0, tzinfo=timezone.utc)},

    # Ansible — backlog
    {"id": "t14", "track_id": "2", "name": "Handlers (02:23) + Roles (07:46)", "weight": 2, "status": "not-started", "sort_order": 0, "column_name": "backlog", "scheduled_day": date(2026, 7, 10)},
    {"id": "t15", "track_id": "2", "name": "Templates + Jinja2 (09:12)", "weight": 2, "status": "not-started", "sort_order": 1, "column_name": "backlog"},
    {"id": "t16", "track_id": "2", "name": "Ansible Vault (04:48)", "weight": 1, "status": "not-started", "sort_order": 2, "column_name": "backlog"},
    # Ansible — done
    {"id": "t17", "track_id": "2", "name": "Ansible Introduction (03:49)", "weight": 1, "status": "complete", "sort_order": 0, "column_name": "done", "completed_at": datetime(2026, 7, 1, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t18", "track_id": "2", "name": "Ansible Architecture", "weight": 1, "status": "complete", "sort_order": 1, "column_name": "done", "completed_at": datetime(2026, 7, 2, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t19", "track_id": "2", "name": "Inventory + Ad-hoc Commands", "weight": 2, "status": "complete", "sort_order": 2, "column_name": "done", "completed_at": datetime(2026, 7, 4, 12, 0, 0, tzinfo=timezone.utc)},

    # Python — backlog
    {"id": "t20", "track_id": "3", "name": "requests + API polling script", "weight": 2, "status": "not-started", "sort_order": 0, "column_name": "backlog"},
    {"id": "t21", "track_id": "3", "name": "pytest fundamentals", "weight": 2, "status": "not-started", "sort_order": 1, "column_name": "backlog"},
    {"id": "t22", "track_id": "3", "name": "Session 1: server_inventory.py", "weight": 2, "status": "not-started", "sort_order": 2, "column_name": "todo", "scheduled_day": date(2026, 7, 10)},
    {"id": "t23", "track_id": "3", "name": "Session 2: log_hunter.py", "weight": 2, "status": "not-started", "sort_order": 3, "column_name": "backlog"},
    # Python — done
    {"id": "t35", "track_id": "3", "name": "Print Function + Literals + Operators", "weight": 1, "status": "complete", "sort_order": 0, "column_name": "done", "completed_at": datetime(2026, 7, 3, 12, 0, 0, tzinfo=timezone.utc)},

    # Ansible Fleet — backlog
    {"id": "t24", "track_id": "4", "name": "Repo init + inventory (real VMs)", "weight": 2, "status": "not-started", "sort_order": 0, "column_name": "todo", "scheduled_day": date(2026, 7, 10)},
    {"id": "t25", "track_id": "4", "name": "Common role (packages/NTP/hostname)", "weight": 3, "status": "not-started", "sort_order": 1, "column_name": "backlog"},
    {"id": "t26", "track_id": "4", "name": "Hardening role (SSH + unattended-upgrades)", "weight": 3, "status": "not-started", "sort_order": 2, "column_name": "backlog"},
    {"id": "t27", "track_id": "4", "name": "Monitoring role (node_exporter)", "weight": 2, "status": "not-started", "sort_order": 3, "column_name": "backlog"},
    {"id": "t28", "track_id": "4", "name": "Ansible Vault + README", "weight": 2, "status": "not-started", "sort_order": 4, "column_name": "backlog"},

    # CI/CD — backlog
    {"id": "t29", "track_id": "5", "name": "GitHub Actions course (CI/CD fundamentals)", "weight": 3, "status": "not-started", "sort_order": 0, "column_name": "backlog"},
    {"id": "t30", "track_id": "5", "name": "Pipeline: lint + validate + Docker build", "weight": 3, "status": "not-started", "sort_order": 1, "column_name": "backlog"},
    {"id": "t31", "track_id": "5", "name": "GHCR push + Trivy scan", "weight": 2, "status": "not-started", "sort_order": 2, "column_name": "backlog"},
    {"id": "t32", "track_id": "5", "name": "Deploy to K8s on push to main", "weight": 2, "status": "not-started", "sort_order": 3, "column_name": "backlog"},

    # Hybrid Inference — backlog
    {"id": "t33", "track_id": "6", "name": "Design doc: LiteLLM proxy config", "weight": 2, "status": "not-started", "sort_order": 0, "column_name": "todo", "scheduled_day": date(2026, 7, 10)},
    {"id": "t34", "track_id": "6", "name": "Test Ollama reachability Lenovo → gaming PC", "weight": 2, "status": "not-started", "sort_order": 1, "column_name": "todo", "scheduled_day": date(2026, 7, 10)},

    # Job Search — mix
    {"id": "t36", "track_id": "7", "name": "Resume v2 — projects section", "weight": 2, "status": "in-progress", "sort_order": 0, "column_name": "in-progress"},
    {"id": "t37", "track_id": "7", "name": "LinkedIn refresh (headline + About + #OpenToWork)", "weight": 1, "status": "not-started", "sort_order": 1, "column_name": "todo"},
    {"id": "t38", "track_id": "7", "name": "Job pipeline: seed 10 A-tier targets", "weight": 2, "status": "not-started", "sort_order": 2, "column_name": "todo", "scheduled_day": date(2026, 7, 12)},
    {"id": "t39", "track_id": "7", "name": "Application cadence: 2/day minimum", "weight": 1, "status": "in-progress", "sort_order": 3, "column_name": "in-progress"},
    {"id": "t40", "track_id": "7", "name": "Portfolio: TaskFlow deployed + documented", "weight": 3, "status": "not-started", "sort_order": 4, "column_name": "backlog"},

    # AWS 3-Tier — all shipped
    {"id": "t41", "track_id": "8", "name": "VPC + subnets + IGW + NAT + route tables", "weight": 3, "status": "complete", "sort_order": 0, "column_name": "done", "completed_at": datetime(2026, 6, 17, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t42", "track_id": "8", "name": "EC2 compute tier + SSM", "weight": 3, "status": "complete", "sort_order": 1, "column_name": "done", "completed_at": datetime(2026, 7, 9, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t43", "track_id": "8", "name": "ALB + target groups + health checks", "weight": 3, "status": "complete", "sort_order": 2, "column_name": "done", "completed_at": datetime(2026, 7, 9, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t44", "track_id": "8", "name": "RDS PostgreSQL + security groups", "weight": 3, "status": "complete", "sort_order": 3, "column_name": "done", "completed_at": datetime(2026, 7, 9, 12, 0, 0, tzinfo=timezone.utc)},
    {"id": "t45", "track_id": "8", "name": "README + architecture diagram + v1.0 tag", "weight": 2, "status": "complete", "sort_order": 4, "column_name": "done", "completed_at": datetime(2026, 7, 9, 12, 0, 0, tzinfo=timezone.utc)},
]


async def seed():
    # Drop and recreate all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        for t in SEED_TRACKS:
            db.add(Track(**t))
        for t in SEED_TASKS:
            db.add(Task(**t))
        await db.commit()

    print(f"Seeded {len(SEED_TRACKS)} tracks, {len(SEED_TASKS)} tasks")


if __name__ == "__main__":
    asyncio.run(seed())
