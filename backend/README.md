# Backend

FastAPI + SQLAlchemy + PostgreSQL. See ../docs/ARCHITECTURE.md for the route ownership map before adding anything here.

Structure:
- `app/routers/` one file per resource, this is where you add your endpoints
- `app/crud/` DB query functions called by routers, keep query logic out of the router functions
- `app/models/` SQLAlchemy table definitions
- `app/schemas/` Pydantic request and response shapes
- `app/core/` config, JWT and password hashing helpers, DB session

Run `alembic revision --autogenerate -m "..."` after any model change, then `alembic upgrade head`.
