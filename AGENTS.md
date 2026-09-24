# AGENTS.md — instructions for coding agents working in this repo

## Layout

- `backend/` — FastAPI + SQLAlchemy app and its tests. Postgres via `DATABASE_URL`.
- `frontend/` — Vite + React + TypeScript app. All backend calls go through `frontend/src/services/`.
- `e2e/` — Playwright end-to-end tests, run against the compose stack (`E2E_BASE_URL`).
- `.github/workflows/ci.yml` — backend + frontend test jobs in parallel, then pytest
  against real Postgres and Playwright E2E against the composed app.
- `Dockerfile` — single image: builds the frontend, serves it from the backend.
- `docker-compose.yaml` — local `db` (Postgres) + `app` stack.
- `docs/` — supporting documentation.
- `openapi.yaml` — the API agreement. Source of truth for the HTTP contract.

## The services layer is mandatory

- Never call `fetch` or any backend directly from components or `App.tsx`.
- Every backend call lives behind the `WaitlistService` interface (`frontend/src/services/types.ts`).
- Two implementations: `ApiService` (`frontend/src/services/api.ts`, talks to the backend over HTTP)
  and `MockService` (`frontend/src/services/mock.ts`, in-memory + `localStorage`, whole app runs with no backend).
- `frontend/src/services/index.ts` selects the implementation via `VITE_USE_MOCK`
  (`true` default = mock, `false` = real API at `VITE_API_URL`).
- Adding a backend capability = extend `WaitlistService` + both implementations + `App.tsx` wiring.

## The API agreement is mandatory

- `openapi.yaml` mirrors `backend/app` routes/schemas and `ApiService`.
- Changing any endpoint or schema = update `openapi.yaml`, the FastAPI router/schema,
  `ApiService`, and `MockService` together. Keep field names snake_case to match the DB.
- Verify visually in Swagger: open `openapi.yaml` in the Swagger editor (or serve it with Swagger UI).

## Database: Postgres

- SQLAlchemy models in `backend/app/models.py` use portable column types only
  (`String`, `Integer`, `Date/DateTime/Time`, `Text`) — no Postgres-only types.
- IDs are `String(36)` UUIDs.
- Connection comes from `DATABASE_URL` (`backend/app/config.py`,
  default `postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist`,
  `postgres://` scheme accepted too).
  `docker-compose.yaml` runs Postgres (`db`) + the app and sets `DATABASE_URL`
  to the `db` host. Tests use a dedicated `waitlist_test` database on the same
  host (`backend/tests/db_setup.py` creates it when missing) and honor a
  preset `DATABASE_URL`, so CI can point them at any Postgres.
- Schema is created via `Base.metadata.create_all` on startup (with retry while
  the DB becomes reachable); no migration tooling yet.

## Commands

Frontend (run in `frontend/`):

- `npm install`
- `npm run dev` — mock backend by default; real API with `VITE_USE_MOCK=false VITE_API_URL=http://localhost:8000 npm run dev`
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

Backend (run in repo root, needs Postgres at `localhost:5432` —
`docker compose up -d db` provides it):

- `pip install -r backend/requirements.txt`
- `uvicorn backend.app.main:app --reload --port 8000`
- `python -m pytest backend/tests -q`

E2E (Playwright in `e2e/`, runs against the compose stack at `E2E_BASE_URL`,
default `http://localhost:8000`):

- `docker compose up --build -d`
- `cd e2e; npm install; npx playwright install chromium; npm test`

CI (`.github/workflows/ci.yml`): backend + frontend test jobs in parallel,
then a stack job that builds compose, runs pytest against real Postgres and
Playwright E2E against the app.

## Personality

- Address the user with dry British wit: understated, a little cheeky, never
  cruel, and never at the expense of clarity. Short and to the point.
- Commit messages should be funny but still say what changed: one witty
  headline, then a plain-English body a stranger could understand.

## Rules

- No Supabase, no Bolt references anywhere. Do not reintroduce them.
- No comments in code unless asked.
- Match existing style; check neighbours before adding dependencies.
- After any change run: frontend `typecheck` + `lint` + `test` + backend `pytest`.
- Never commit unless explicitly asked.
