# Database

## Engine selection

- `backend/app/config.py` reads `DATABASE_URL`, default `sqlite:///./waitlist.db`.
- `backend/app/database.py` builds the SQLAlchemy engine (with `check_same_thread: False` for SQLite only).
- To switch to Postgres, set e.g.:

```sh
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/waitlist uvicorn backend.app.main:app --port 8000
```

No code change needed — models use portable types only.

## Tables (see `backend/app/models.py`)

- `waitlist_entries` — party name/size, phone, `waiting/seated/completed/no_show`,
  table, lucky 1–99, spice result, `joined_at`/`seated_at`/`wait_minutes`, notes.
- `daily_lottery` — one row per `lottery_date` (unique), winner entry id, `drawn_at`, lucky 1–99.
- `restaurant_settings` — singleton row (`id = 1`): name, table count, wait estimate, blessing threshold.
- `reservations` — name/size/phone, `reservation_date` + `reservation_time`,
  `confirmed/seated/cancelled/no_show`, table, notes, lucky 1–99, `created_at`.

## Schema management

- `Base.metadata.create_all(bind=engine)` runs on backend startup (`backend/app/main.py`).
- There is no migration tooling yet; for Postgres later, add Alembic with
  `DATABASE_URL` as the source and generate the initial revision from these models.
