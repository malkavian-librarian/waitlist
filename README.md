# Waitlist (Thai Restaurant Manager)

Local-first restaurant waitlist. No Supabase, no Bolt.

```
backend/      # FastAPI + SQLAlchemy app and its tests. Postgres via `DATABASE_URL`
docs/         # supporting documentation (architecture, api, database)
frontend/     # Vite + React + TS app (services layer, mock backend by default)
e2e/          # Playwright end-to-end tests against the compose stack
Dockerfile    # single image: frontend build served from the backend
docker-compose.yaml  # local Postgres (db) + app stack
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

Postgres + app via Docker:

```sh
docker compose up --build
```

Local API against local Postgres:

```sh
DATABASE_URL=postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist uvicorn backend.app.main:app --port 8000
```

## Deploy to Railway

The repo builds into one image (frontend baked into the backend), so hosting
needs two Railway services in one project:

1. `+ New → GitHub Repo` — pick this repo. Railway detects the root
   `Dockerfile` and builds it. No build args needed: the image defaults to
   `VITE_USE_MOCK=false` with a same-origin API (`/api`), which is correct
   behind Railway's domain.
2. `+ New → Database → Postgres` — managed Postgres, persistence and backups
   included, no volume to configure.
3. In the app service's **Variables** tab, add `DATABASE_URL` as a **reference
   variable** pointing at the Postgres service's `DATABASE_URL` (stays in sync
   if credentials rotate). The app accepts both `postgresql://` and
   `postgres://` schemes.
4. In the app service's **Settings → Deploy**, set the healthcheck path to
   `/api/health`.
5. Railway assigns a `*.up.railway.app` HTTPS domain automatically; attach a
   custom domain if wanted. The app listens on Railway's injected `PORT`.

`docker-compose.yaml` is for local dev only — Railway does not run it.
Hobby ($5/mo incl. $5 usage credit) comfortably fits one small app + Postgres.

## Tests

Backend tests need Postgres at `localhost:5432`
(`docker compose up -d db` provides it; a `waitlist_test` database is
created automatically and a preset `DATABASE_URL` is honored):

```sh
cd frontend; npm test
python -m pytest backend/tests -q
```

E2E (Playwright, needs the compose stack up):

```sh
docker compose up --build -d
cd e2e; npm install; npx playwright install chromium; npm test
```

CI (`.github/workflows/ci.yml`) runs backend + frontend tests in parallel,
then builds the compose stack and runs the pytest suite against real Postgres
plus the Playwright E2E suite against the stacked app.

See `docs/`, `frontend/README.md`, `backend/README.md`.
