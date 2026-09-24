import os
from datetime import date

from backend.tests.db_setup import DEFAULT_TEST_DATABASE_URL, ensure_test_database

os.environ.setdefault("DATABASE_URL", DEFAULT_TEST_DATABASE_URL)
ensure_test_database(os.environ["DATABASE_URL"])

from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from backend.app.database import Base, get_db  # noqa: E402
from backend.app.main import app  # noqa: E402

engine = create_engine(os.environ["DATABASE_URL"])
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)


def _override():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override
client = TestClient(app)

TODAY = date.today().isoformat()


def test_health():
    assert client.get("/api/health").json() == {"ok": True}


def test_waitlist_crud():
    r = client.post("/api/waitlist", json={"name": "Somchai", "party_size": 4})
    assert r.status_code == 201
    entry = r.json()
    assert entry["status"] == "waiting"

    assert len(client.get("/api/waitlist").json()) >= 1

    r = client.patch(f"/api/waitlist/{entry['id']}/seat", json={"table_number": 5})
    assert r.status_code == 200
    assert r.json()["status"] == "seated"

    r = client.patch(f"/api/waitlist/{entry['id']}/spice", json={"result": "Hot"})
    assert r.json()["spice_roulette"] == "Hot"

    r = client.patch(f"/api/waitlist/{entry['id']}/status", json={"status": "completed"})
    assert r.json()["status"] == "completed"

    assert client.delete(f"/api/waitlist/{entry['id']}").status_code == 204


def test_lottery_draw_and_get():
    w = client.post("/api/waitlist", json={"name": "Lucky", "party_size": 2}).json()
    r = client.post("/api/lottery/draw", json={"winner_entry_id": w["id"], "lottery_date": TODAY})
    assert r.status_code == 200
    assert r.json()["winner_entry_id"] == w["id"]
    r = client.get("/api/lottery", params={"lottery_date": TODAY})
    assert r.json()["winner_entry_id"] == w["id"]


def test_settings_singleton():
    assert client.get("/api/settings").json()["restaurant_name"] == "Sawasdee"
    r = client.put(
        "/api/settings",
        json={
            "id": 1,
            "restaurant_name": "Test",
            "table_count": 20,
            "default_wait_estimate": 10,
            "buddha_blessing_threshold": 25,
        },
    )
    assert r.json()["table_count"] == 20


def test_reservations_flow():
    r = client.post(
        "/api/reservations",
        json={
            "name": "Reserve",
            "party_size": 3,
            "reservation_date": TODAY,
            "reservation_time": "18:30:00",
            "table_number": 7,
        },
    )
    assert r.status_code == 201
    res = r.json()
    assert res["status"] == "confirmed"

    r = client.post(f"/api/reservations/{res['id']}/seat", json={"table_number": 7})
    assert r.status_code == 200
    body = r.json()
    assert body["reservation"]["status"] == "seated"
    assert body["waitlist_entry"]["status"] == "seated"

    r2 = client.post(
        "/api/reservations",
        json={"name": "Cancel", "party_size": 2, "reservation_date": TODAY, "reservation_time": "19:00:00"},
    ).json()
    assert client.patch(f"/api/reservations/{r2['id']}/cancel").json()["status"] == "cancelled"
    assert client.delete(f"/api/reservations/{r2['id']}").status_code == 204
