# GlobeTrotter

Personalized, collaborative travel planning app. Multi-city itineraries, budget tracking, calendar view, public trip sharing, community feed.

## Start here

1. Read `docs/ARCHITECTURE.md` first. It has the module ownership map, claim a row before you write code.
2. Read `docs/SYSTEM_DESIGN.md` for the data flow of the four core features.
3. Read `docs/GlobeTrotter_MVP_Plan.md` for the full screen-by-screen breakdown and API surface.

## Local setup

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
cp ../.env.example .env
python -m venv venv
source venv/bin/activate   # on Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd frontend
cp ../.env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:8000`, interactive API docs at `http://localhost:8000/docs`. Frontend runs at `http://localhost:5173`.

## Branching

`feature/<module>-<short-description>`, matching the module names in the ownership table in `docs/ARCHITECTURE.md`. One pull request per vertical slice (backend route plus its frontend page), not one giant PR at the end.

## Tech stack

Backend: Python, FastAPI, SQLAlchemy, Alembic, PostgreSQL, JWT auth (python-jose), passlib for password hashing.
Frontend: React, Vite, Tailwind, React Router, Zustand, Recharts.

Python was chosen over a Node backend specifically because AI-powered features (itinerary suggestions, budget prediction, activity recommendations) are on the roadmap, and keeping the API and any future ML/AI code in the same language avoids a second service and a network hop between them.
