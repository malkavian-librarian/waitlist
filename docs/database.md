# Database

## Engine selection

- `backend/app/config.py` reads `DATABASE_URL`,
  default `postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist`.
- `backend/app/database.py` builds the SQLAlchemy engine (with `pool_pre_ping`).
- `docker-compose.yaml` runs Postgres (`db`) + the app and points `DATABASE_URL`
  at the `db` host. Local API against local Postgres:

```sh
DATABASE_URL=postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist uvicorn backend.app.main:app --port 8000
```

No code change needed — models use portable types only.

## Tests

- `backend/tests/test_api.py` and `backend/tests/test_actions.py` run the API
  through HTTP against Postgres. They default to a dedicated `waitlist_test`
  database on the `DATABASE_URL` host (`backend/tests/db_setup.py` creates it
  when missing) and honor a preset `DATABASE_URL`, so CI can point them at any
  Postgres. Provide one locally with `docker compose up -d db`, then
  `python -m pytest backend/tests -q`.

## Tables (see `backend/app/models.py`)

- `waitlist_entries` — party name/size, phone, `waiting/seated/completed/no_show`,
  table, lucky 1–99, spice result, `joined_at`/`seated_at`/`wait_minutes`, notes.
- `daily_lottery` — one row per `lottery_date` (unique), winner entry id, `drawn_at`, lucky 1–99.
- `restaurant_settings` — singleton row (`id = 1`): name, table count, wait estimate, blessing threshold.
- `reservations` — name/size/phone, `reservation_date` + `reservation_time`,
  `confirmed/seated/cancelled/no_show`, table, notes, lucky 1–99, `created_at`.

## Schema management

- `Base.metadata.create_all(bind=engine)` runs on backend startup (`backend/app/main.py`),
  with retry while the DB becomes reachable.
- There is no migration tooling yet; to add it, use Alembic with
  `DATABASE_URL` as the source and generate the initial revision from these models.
