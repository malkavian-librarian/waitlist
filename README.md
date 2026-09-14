# Waitlist (Thai Restaurant Manager)

Local-first restaurant waitlist. No Supabase, no Bolt.

```
backend/      # FastAPI + SQLAlchemy app and its tests (SQLite default, Postgres via DATABASE_URL)
docs/         # supporting documentation (architecture, api, database)
frontend/     # Vite + React + TS app (services layer, mock backend by default)
AGENTS.md     # instructions for coding agents
CLAUDE.md     # imports AGENTS.md
openapi.yaml  # API agreement — open in Swagger
```

## Quickstart

Mock mode (no backend needed):

```sh
cd frontend
npm install
npm run dev
```

Real local API:

```sh
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
cd frontend
VITE_USE_MOCK=false VITE_API_URL=http://localhost:8000 npm run dev
```

Postgres later:

```sh
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/waitlist uvicorn backend.app.main:app --port 8000
```

## Tests

```sh
cd frontend; npm test
python -m pytest backend/tests -q
```

See `docs/`, `frontend/README.md`, `backend/README.md`.
