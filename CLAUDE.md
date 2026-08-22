# Claude Code instructions for GlobeTrotter

Full rules live in `docs/AI_RULES.md`, read that file in full before generating or editing code in this repo. This file is a pointer, not a substitute.

Also read before starting work:
- `docs/ARCHITECTURE.md`, module ownership map and repo layout
- `docs/SYSTEM_DESIGN.md`, data flow for the four core features
- `docs/GlobeTrotter_MVP_Plan.md`, full screen-by-screen breakdown

Summary of `docs/AI_RULES.md`, the full doc has the reasoning behind each of these:

1. Do not hallucinate. Verify libraries against `requirements.txt`/`package.json`, verify model fields against `backend/app/models/`, verify route signatures against `backend/app/routers/`, never invent an env var, config value, or API method that has not been checked. Read a file before editing it, do not edit from memory.
2. Stay in scope. Check the ownership table in `docs/ARCHITECTURE.md` before touching a router outside your assigned module. Any model change under `backend/app/models/` needs a matching Alembic migration in the same change. Prefer the smallest change that solves the task.
3. Security is non-negotiable. No hardcoded secrets, ever. Every route touching user data checks resource ownership against the authenticated user. Every `/admin/*` route is gated server-side via a role dependency, not just hidden in the UI. All queries go through SQLAlchemy, never raw string-built SQL. All request bodies validated through Pydantic. CORS restricted to `FRONTEND_URL`, never wildcard with credentials.
4. Report what actually happened when running commands, tests, or servers, do not report expected success as if it were observed success.
5. If uncertain, say so explicitly rather than producing a confident wrong answer.
