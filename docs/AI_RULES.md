# AI Assistant Rules, GlobeTrotter

Read this before generating or editing any code in this repo. These rules apply to every AI tool used on this project (Cursor, Claude Code, Copilot, whatever else). If a suggestion from any tool violates a rule here, the rule wins, reject the suggestion and fix it by hand.

---

## 1. Do not hallucinate

- Before using any library, function, or API, confirm it exists in `requirements.txt` (backend) or `package.json` (frontend). If it is not listed there and you believe it is needed, add it explicitly and say so, do not silently assume a package is installed.
- Before referencing a database column, table, or relationship, open the actual model file in `backend/app/models/` and check it. Do not infer a field exists because it "should" logically be there. If the field is missing and the task needs it, that is a schema change, flag it, do not invent it silently.
- Before calling an existing API route from the frontend, check the actual router file in `backend/app/routers/` for the real path, method, and response shape. Do not guess a route signature from the name alone or from `docs/ARCHITECTURE.md`, that document is a summary, the router file is the source of truth.
- Never invent a FastAPI, SQLAlchemy, Pydantic, or React API that sounds plausible but that you have not verified. If unsure whether a method exists on a given version, say so and check the docs, do not produce confident-sounding code for a method that does not exist.
- Never fabricate an environment variable, config value, or file path. If a value is needed and not in `.env.example`, add it there and explain why, do not hardcode a guessed value.
- Do not claim a test passed, a migration ran, or a server started unless you actually ran it and saw the output. Report what actually happened, including errors, not what you expect should have happened.
- When editing a file, read its current content first. Do not rewrite a file from memory of what you generated three turns ago, files change, re-read before editing.

## 2. Stay within scope, keep it stable

- Do not modify `backend/app/models/` without a matching Alembic migration in the same change. A model change with no migration will break every other module silently.
- Do not touch a router file outside the module you were asked to work on. Check `docs/ARCHITECTURE.md`'s ownership table, if the task is not in your assigned row, flag it instead of editing it.
- Do not change the shape of an existing API response (renaming or removing a field) without checking every frontend file that consumes it. A silent response shape change is the most common way one person's change breaks someone else's screen.
- Prefer the smallest change that solves the task. Do not refactor unrelated code, rename unrelated variables, or "improve" working code you were not asked to touch, this is how a one-line fix becomes an unreviewable diff.
- Follow the existing patterns in the codebase (how other routers structure a query, how other pages call the API) rather than introducing a new pattern for a similar problem. Consistency matters more than your personal preference for a cleaner approach.
- If a task is ambiguous or the requirements conflict with what is already built, ask, do not pick an interpretation and proceed silently.

## 3. Security, non-negotiable

**Secrets**
- Never hardcode a secret, API key, database password, or JWT signing key in source code, ever, not even "temporarily" or "for testing." All secrets come from environment variables via `backend/app/core/config.py`.
- Never commit a `.env` file. `.gitignore` already excludes it, do not remove that line.
- Never print or log a JWT, password, or `Authorization` header value, not even at debug level.

**Auth and access control**
- Every route that touches a user's own data must check that the authenticated user (`Depends(get_current_user)`) actually owns the resource being accessed or modified. Fetching a trip by ID without checking `trip.user_id == current_user.id` is an authorization bug, not an edge case.
- Every `/admin/*` route must depend on a server-side role check (`Depends(require_role("admin"))`). A role check that only exists in the frontend (hiding a button) is not access control, it is decoration.
- `GET /public/:slug` is the only route allowed to skip authentication. If you find yourself removing an auth dependency from any other route "to make testing easier," put it back before committing.
- Passwords are hashed with `passlib[bcrypt]` before storage, never stored, logged, or returned in any response, in plain text or otherwise.

**Data access**
- All database queries go through SQLAlchemy's query builder or ORM. Never build a SQL string by concatenating or f-string interpolating user input, that is a SQL injection vector regardless of how unlikely it seems for a hackathon project.
- All request bodies are validated through a Pydantic schema before touching the database. Do not read raw `request.json()` and trust its shape.
- File uploads (profile photos, trip cover photos) must validate file type and size server-side before storage, never trust the frontend's validation alone.

**Transport and config**
- CORS in `backend/app/main.py` allows only the actual frontend URL from `FRONTEND_URL`, never `allow_origins=["*"]` alongside `allow_credentials=True`, that combination is a real vulnerability, not a style nitpick.
- Any new third-party dependency gets pinned to a specific version in `requirements.txt` or `package.json`, not left floating, an unpinned dependency can silently pull in a breaking or compromised update.
- Frontend never stores the JWT in `localStorage` if it can be avoided, prefer in-memory storage per `docs/ARCHITECTURE.md`. If a persistent token is genuinely needed, that is a decision to flag, not to default into.

## 4. When you are not sure

Say so. "I have not verified this endpoint exists, check `backend/app/routers/trips.py` before using it" is a correct and useful response. A confident, fluent, wrong answer is worse than an honest "I don't know, here is how to check."
