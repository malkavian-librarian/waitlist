# API

Full contract: [`openapi.yaml`](../openapi.yaml) — open it in the
[Swagger editor](https://editor.swagger.io/) or any Swagger UI to browse and try it.

## Run the backend

```sh
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8000
```

Health check: `GET http://localhost:8000/api/health` → `{"ok": true}`.

## Endpoints

| Method & path | Purpose |
|---|---|
| `GET /api/waitlist` | List entries by `joined_at` |
| `POST /api/waitlist` | Add party (always `waiting`) |
| `PATCH /api/waitlist/{id}/seat` | Seat (server sets `seated_at`, `wait_minutes`) |
| `PATCH /api/waitlist/{id}/status` | Set `waiting/seated/completed/no_show` |
| `PATCH /api/waitlist/{id}/spice` | Save spice roulette result |
| `DELETE /api/waitlist/{id}` | Remove entry |
| `GET /api/lottery?lottery_date=` | Lottery row for the day (or `null`) |
| `POST /api/lottery/draw` | Draw/upsert lottery for the day |
| `GET /api/settings` | Singleton settings (created with defaults if missing) |
| `PUT /api/settings` | Save settings |
| `GET /api/reservations` | List reservations by date then time |
| `POST /api/reservations` | Add reservation (always `confirmed`) |
| `PATCH /api/reservations/{id}/cancel` | Cancel |
| `POST /api/reservations/{id}/seat` | Transactional seat → reservation + waitlist entry |
| `DELETE /api/reservations/{id}` | Remove reservation |

## Frontend wiring

- Contract implementation (HTTP): `frontend/src/services/api.ts`
- Offline implementation: `frontend/src/services/mock.ts`
- Selector: `VITE_USE_MOCK` / `VITE_API_URL` (see `frontend/.env.example`)
