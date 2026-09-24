from pathlib import Path
from time import sleep

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import OperationalError

from .database import Base, engine
from .routers import lottery, reservations, settings, waitlist

for _attempt in range(30):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except OperationalError:
        sleep(2)
else:
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Waitlist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(waitlist.router)
app.include_router(lottery.router)
app.include_router(settings.router)
app.include_router(reservations.router)


@app.get("/api/health")
def health():
    return {"ok": True}


def _find_frontend_dist() -> Path | None:
    here = Path(__file__).resolve()
    candidates = [
        here.parents[2] / "frontend" / "dist",
        Path("/app/frontend/dist"),
        here.parent / "static",
    ]
    for candidate in candidates:
        if (candidate / "index.html").is_file():
            return candidate
    return None


_dist = _find_frontend_dist()
if _dist is not None:
    assets_dir = _dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/", include_in_schema=False)
    def _root():
        return FileResponse(_dist / "index.html")

    @app.get("/{full_path:path}", include_in_schema=False)
    def _spa(full_path: str):
        if full_path.startswith("api/"):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        if full_path in ("docs", "redoc", "openapi.json") or full_path.startswith(
            ("docs/", "redoc/", "openapi")
        ):
            return JSONResponse({"detail": "Not Found"}, status_code=404)
        candidate = _dist / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(_dist / "index.html")
