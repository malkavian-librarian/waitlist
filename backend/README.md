# Backend

FastAPI + SQLAlchemy. SQLite by default, Postgres via `DATABASE_URL`.

```sh
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
python -m pytest backend/tests -q
```

Switch to Postgres:

```sh
DATABASE_URL=postgresql+psycopg2://user:pass@localhost:5432/waitlist uvicorn backend.app.main:app --port 8000
```

Contract: [`openapi.yaml`](../openapi.yaml).
