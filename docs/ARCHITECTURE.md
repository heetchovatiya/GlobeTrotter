# GlobeTrotter, Architecture

This is the source of truth for how the system fits together. Read this before writing code. If something here conflicts with what you are about to build, raise it in the team channel first, do not silently diverge.

Reference docs: `GlobeTrotter_MVP_Plan.md` (screen-by-screen breakdown, already shared with the team), `docs/SYSTEM_DESIGN.md` (data flow diagrams for the flows described here), `docs/AI_RULES.md` (required reading before using Cursor, Claude Code, or any AI assistant on this repo), and `docs/GlobeTrotter-8-hours.excalidraw` (visual 8-hour plan board).

---

## 1. High-level shape

```
                        +-------------------+
                        |   React Frontend  |
                        |  (Vite + Tailwind)|
                        +---------+---------+
                                  |
                                  |  REST, JSON, JWT in Authorization header
                                  v
                        +-------------------+
                        |  FastAPI           |
                        |  (Python, async)   |
                        +---------+---------+
                                  |
                    +-------------+-------------+
                    |                           |
                    v                           v
          +------------------+         +------------------+
          |  PostgreSQL       |         |  Object storage   |
          |  (SQLAlchemy ORM) |         |  (S3-compatible,  |
          |                    |         |   photos/covers)  |
          +------------------+         +------------------+
```

One backend, one frontend, one database. No microservices for the MVP. Splitting services now would cost more time than it saves at this scale, revisit after the MVP proves itself.

---

## 2. Repository layout

```
globetrotter/
  backend/
    app/
      core/         # config, security (JWT, password hashing), db session
      models/       # SQLAlchemy models, one file per table group
      schemas/      # Pydantic request/response schemas
      routers/      # route definitions, one file per resource
      crud/         # DB query functions, called by routers
      main.py       # app entrypoint, router registration
    alembic/        # migrations
    requirements.txt
  frontend/
    src/
      pages/        # one folder per route, matches the route table below
      components/   # shared, reusable UI pieces
      store/         # zustand stores (trip builder state, auth state)
      api/           # fetch wrappers, one file per backend resource
  docs/
    ARCHITECTURE.md      # this file
    SYSTEM_DESIGN.md     # data flow diagrams per feature
    GlobeTrotter_MVP_Plan.md
    AI_RULES.md          # required before any AI-assisted code
    GlobeTrotter-8-hours.excalidraw  # visual 8-hour plan board
  .cursorrules           # Cursor pointer to docs/AI_RULES.md
  CLAUDE.md              # Claude Code pointer to docs/AI_RULES.md
  .cursor/rules/         # always-on Cursor project rules
  .env.example
  docker-compose.yml
  README.md
```

Backend and frontend stay in one repo (monorepo, not two separate repos) so a schema change and its matching frontend change land in the same pull request. Do not create a second repository for the frontend.

---

## 3. Module ownership map

This is how the screens from the MVP plan map to backend and frontend modules, so each person can claim a vertical slice (one screen's backend route plus its frontend page) instead of everyone touching the same files.

| Module | Backend routes | Frontend pages | Suggested owner |
|---|---|---|---|
| Auth | `/auth/*` (`auth.py`) | `/login`, `/register` | Person A |
| Trips core | `/trips/*`, `/stops/*`, `/sections/*` (`trips.py`, `stops.py`, `sections.py`) | `/trips`, `/trips/new`, `/trips/:id/build` | Person B |
| Itinerary and budget | `/trips/:id/itinerary`, `/trips/:id/budget` (`itinerary.py`, `budget.py`) | `/trips/:id`, `/trips/:id/calendar` | Person C |
| Search | `/cities`, `/activities` (`cities.py`, `activities.py`) | `/search` | Person D |
| Sharing | `/trips/:id/share`, `/public/:slug` | `/t/:slug` | whoever finishes their slice first |
| Community | `/community/*` | `/community` | whoever finishes their slice first |
| Admin | `/admin/*` | `/admin` | last priority, pick up after everything else is stable |

Each row is a vertical slice on purpose. Claim a row, build the route and the page together, open one pull request per row. This keeps merge conflicts low since nobody is editing the same route file as someone else.

---

## 4. Data flow, request lifecycle

Every authenticated request follows the same path. Know this cold, it is the same for all 13 screens.

1. Frontend page calls a function in `frontend/src/api/*.ts`, which wraps `fetch` and attaches the JWT from the auth store.
2. Request hits FastAPI, passes through a dependency (`Depends(get_current_user)`) that verifies the JWT and injects the user.
3. Admin-only routes additionally depend on `Depends(require_role('admin'))`.
4. Router function calls into `crud/`, which builds the SQLAlchemy query and talks to Postgres.
5. The router returns a Pydantic response schema, never raw SQLAlchemy model instances for joined data (see the itinerary endpoint note below).
6. Frontend receives JSON, updates the relevant store or local component state.

For the two heaviest reads (`GET /trips/:id/itinerary` and `GET /trips/:id/budget`), do the grouping and aggregation in the controller or a SQL view, not in the React component. If a frontend page is doing `.reduce()` over raw rows to build a day-by-day structure, that logic is in the wrong layer, move it server-side.

---

## 5. Auth and roles

- JWT issued on login/register via `python-jose`, stored in memory on the frontend plus a refresh mechanism if time allows (for MVP, a long-lived token in memory is acceptable, do not overbuild refresh token rotation before the core product works).
- Passwords hashed with `passlib[bcrypt]`, never stored or logged in plain text.
- `users.role` is either `user` or `admin`. Role is read from the JWT claim server-side on every `/admin/*` route via a FastAPI dependency. Never trust a role flag sent from the client.
- Public routes (`GET /public/:slug`) skip auth entirely. `POST /public/:slug/copy` requires auth, since it writes into a specific user's account.

---

## 6. Environment and local dev

- Postgres runs locally via `docker-compose.yml` (see repo root).
- Copy `.env.example` to `.env` in both `backend/` and `frontend/` before running anything.
- `backend`: create a virtualenv, `pip install -r requirements.txt`, `alembic upgrade head`, `python -m app.seed`, `uvicorn app.main:app --reload`.
- `frontend`: `npm install`, `npm run dev`.
- Interactive API docs are available at `http://localhost:8000/docs` once the backend is running, useful for anyone building a frontend page against a route someone else owns.

---

## 7. Non-negotiables (things that will break other people's work if skipped)

- Do not change files under `backend/app/models/` without posting in the team channel first, and always pair a model change with an Alembic migration (`alembic revision --autogenerate -m "..."`). Every field is referenced by someone else's module.
- Do not commit `.env` files. `.gitignore` already excludes them, keep it that way.
- Every new backend route needs a corresponding entry in `docs/SYSTEM_DESIGN.md` if it introduces a new data flow (a new join, a new external call). One paragraph is enough, this is for the next person reading the codebase, not a full spec.
- Branch naming: `feature/<module>-<short-description>`, for example `feature/auth-jwt-middleware`. Matches the module names in the ownership table above.
