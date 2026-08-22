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
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev

# 3. Frontend (new terminal)
cd frontend
cp ../.env.example .env
npm install
npm run dev
```

## Branching

`feature/<module>-<short-description>`, matching the module names in the ownership table in `docs/ARCHITECTURE.md`. One pull request per vertical slice (backend route plus its frontend page), not one giant PR at the end.

## Tech stack

Backend: Node.js, Express, Prisma, PostgreSQL, JWT auth.
Frontend: React, Vite, Tailwind, React Router, Zustand, Recharts.
