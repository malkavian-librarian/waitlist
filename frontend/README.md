# Frontend

Vite + React + TypeScript app. All backend calls go through `src/services/`
(`WaitlistService` interface + `ApiService` + `MockService`).

```sh
npm install
npm run dev
```

- Mock backend by default (`VITE_USE_MOCK=true`): in-memory + `localStorage`,
  whole app runs with no backend.
- Real API: `VITE_USE_MOCK=false VITE_API_URL=http://localhost:8000 npm run dev`

Checks: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
