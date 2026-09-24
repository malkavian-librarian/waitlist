# AGENTS.md — instructions for coding agents working in this repo

## Layout

- `backend/` — FastAPI + SQLAlchemy app and its tests. Postgres via `DATABASE_URL`.
- `frontend/` — Vite + React + TypeScript app. All backend calls go through `frontend/src/services/`.
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
  default `postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist`).
  `docker-compose.yaml` runs Postgres (`db`) + the app and sets `DATABASE_URL`
  to the `db` host. Tests override `DATABASE_URL` with a temp SQLite file.
- Schema is created via `Base.metadata.create_all` on startup (with retry while
  the DB becomes reachable); no migration tooling yet.

## Commands

Frontend (run in `frontend/`):

- `npm install`
- `npm run dev` — mock backend by default; real API with `VITE_USE_MOCK=false VITE_API_URL=http://localhost:8000 npm run dev`
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`

Backend (run in repo root):

- `pip install -r backend/requirements.txt`
- `uvicorn backend.app.main:app --reload --port 8000`
- `python -m pytest backend/tests -q`

## Rules

- No Supabase, no Bolt references anywhere. Do not reintroduce them.
- No comments in code unless asked.
- Match existing style; check neighbours before adding dependencies.
- After any change run: frontend `typecheck` + `lint` + `test` + backend `pytest`.
- Never commit unless explicitly asked.
