# Backend

FastAPI + SQLAlchemy + PostgreSQL. See `../docs/ARCHITECTURE.md` for the route ownership map before adding anything here. Follow `../docs/AI_RULES.md` before generating or editing code.

## Setup

```bash
cp ../.env.example .env
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs
