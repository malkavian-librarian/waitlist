# Architecture

```
waitlist/
├── backend/    # FastAPI + SQLAlchemy app and its tests
├── docs/       # supporting documentation
├── frontend/   # Vite + React + TS app (services layer for all backend calls)
├── AGENTS.md   # instructions for coding agents
├── CLAUDE.md   # imports AGENTS.md
└── openapi.yaml# API agreement (view in Swagger)
```

## Request flow

- UI (`frontend/src/App.tsx` + components) never touches HTTP directly.
- It calls the `WaitlistService` interface (`frontend/src/services/types.ts`)
  via the `service` singleton (`frontend/src/services/index.ts`).
- `VITE_USE_MOCK=true` (default) → `MockService`: in-memory store persisted to
  `localStorage`, so the whole app runs with no backend.
- `VITE_USE_MOCK=false` → `ApiService`: `fetch` against `VITE_API_URL`
  (default `http://localhost:8000`), which serves the FastAPI backend.
- The backend is stateless HTTP over SQLAlchemy; SQLite locally, Postgres via `DATABASE_URL`.

## Key decisions

- Seat-reservation is transactional server-side: `POST /api/reservations/{id}/seat`
  marks the reservation seated AND creates the matching seated waitlist entry.
  `MockService.seatReservation` mirrors that in one method.
- Wait-time math (`seated_at`, `wait_minutes`) is computed server-side on seat.
- `openapi.yaml` is the contract both sides implement; update it with any API change.
