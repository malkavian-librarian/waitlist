# Backend

FastAPI + SQLAlchemy. Postgres via `DATABASE_URL`
(default `postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist`).

```sh
docker compose up --build
```

```sh
pip install -r backend/requirements.txt
python -m pytest backend/tests -q
```

Local API against local Postgres:

```sh
DATABASE_URL=postgresql+psycopg2://waitlist:waitlist@localhost:5432/waitlist uvicorn backend.app.main:app --port 8000
```

Contract: [`openapi.yaml`](../openapi.yaml).
