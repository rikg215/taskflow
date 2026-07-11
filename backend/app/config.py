"""Database configuration — PostgreSQL in prod, SQLite in dev."""
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./taskflow.db")

# PostgreSQL: postgresql+asyncpg://user:pass@host:5432/dbname
# SQLite (dev): sqlite+aiosqlite:///./taskflow.db
