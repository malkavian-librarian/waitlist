import os
import uuid
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
REDRAW_DAY = "2026-02-15"


def _add_party(name, **kwargs):
    payload = {"name": name, "party_size": 2}
    payload.update(kwargs)
    r = client.post("/api/waitlist", json=payload)
    assert r.status_code == 201, r.text
    return r.json()


def test_party_full_lifecycle():
    entry = _add_party("Action Lifecycle", party_size=4, phone="081-000-0001", notes="window")
    assert entry["status"] == "waiting"
    assert entry["table_number"] is None
    assert entry["seated_at"] is None
    assert 1 <= entry["lucky_number"] <= 99
    assert entry["joined_at"]

    r = client.patch(f"/api/waitlist/{entry['id']}/seat", json={"table_number": 3})
    assert r.status_code == 200, r.text
    seated = r.json()
    assert seated["status"] == "seated"
    assert seated["table_number"] == 3
    assert seated["seated_at"] is not None
    assert seated["wait_minutes"] is not None and seated["wait_minutes"] >= 0

    r = client.patch(f"/api/waitlist/{entry['id']}/spice", json={"result": "Volcano"})
    assert r.status_code == 200, r.text
    assert r.json()["spice_roulette"] == "Volcano"

    r = client.patch(f"/api/waitlist/{entry['id']}/status", json={"status": "completed"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "completed"

    assert client.delete(f"/api/waitlist/{entry['id']}").status_code == 204
    assert client.patch(f"/api/waitlist/{entry['id']}/status", json={"status": "completed"}).status_code == 404


def test_party_no_show_flow():
    entry = _add_party("Action NoShow")
    r = client.patch(f"/api/waitlist/{entry['id']}/status", json={"status": "no_show"})
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "no_show"
    ids = [e["id"] for e in client.get("/api/waitlist").json()]
    assert entry["id"] in ids
    assert client.delete(f"/api/waitlist/{entry['id']}").status_code == 204


def test_waitlist_create_validation():
    assert client.post("/api/waitlist", json={"name": "", "party_size": 2}).status_code == 422
    assert client.post("/api/waitlist", json={"name": "X", "party_size": 0}).status_code == 422
    assert client.post("/api/waitlist", json={"name": "X", "party_size": 21}).status_code == 422


def test_waitlist_seat_status_spice_rejections():
    entry = _add_party("Action Reject")
    assert client.patch(f"/api/waitlist/{entry['id']}/seat", json={"table_number": 0}).status_code == 422
    assert client.patch(f"/api/waitlist/{entry['id']}/seat", json={"table_number": 51}).status_code == 422
    assert client.patch(f"/api/waitlist/{entry['id']}/status", json={"status": "eating"}).status_code == 400
    assert client.patch(f"/api/waitlist/{entry['id']}/status", json={}).status_code == 400
    assert client.patch(f"/api/waitlist/{entry['id']}/spice", json={"result": "Inferno"}).status_code == 422

    missing = str(uuid.uuid4())
    assert client.patch(f"/api/waitlist/{missing}/seat", json={"table_number": 1}).status_code == 404
    assert client.patch(f"/api/waitlist/{missing}/status", json={"status": "completed"}).status_code == 404
    assert client.patch(f"/api/waitlist/{missing}/spice", json={"result": "Hot"}).status_code == 404
    assert client.delete(f"/api/waitlist/{missing}").status_code == 404
    assert client.delete(f"/api/waitlist/{entry['id']}").status_code == 204


def test_seat_without_table_number():
    entry = _add_party("Action NoTable")
    r = client.patch(f"/api/waitlist/{entry['id']}/seat", json={})
    assert r.status_code == 200, r.text
    seated = r.json()
    assert seated["status"] == "seated"
    assert seated["table_number"] is None
    assert seated["seated_at"] is not None
    assert client.delete(f"/api/waitlist/{entry['id']}").status_code == 204


def test_waitlist_lists_in_join_order():
    first = _add_party("Action Order A")
    second = _add_party("Action Order B")
    ids = [e["id"] for e in client.get("/api/waitlist").json()]
    assert ids.index(first["id"]) < ids.index(second["id"])
    assert client.delete(f"/api/waitlist/{first['id']}").status_code == 204
    assert client.delete(f"/api/waitlist/{second['id']}").status_code == 204


def test_lottery_empty_day_returns_null():
    r = client.get("/api/lottery", params={"lottery_date": "2026-01-05"})
    assert r.status_code == 200
    assert r.json() is None


def test_lottery_redraw_updates_same_row():
    w1 = _add_party("Action Lotto One")
    w2 = _add_party("Action Lotto Two")
    first = client.post(
        "/api/lottery/draw", json={"winner_entry_id": w1["id"], "lottery_date": REDRAW_DAY}
    ).json()
    assert first["winner_entry_id"] == w1["id"]
    assert first["drawn_at"] is not None

    second = client.post(
        "/api/lottery/draw", json={"winner_entry_id": w2["id"], "lottery_date": REDRAW_DAY}
    ).json()
    assert second["id"] == first["id"]
    assert second["winner_entry_id"] == w2["id"]

    got = client.get("/api/lottery", params={"lottery_date": REDRAW_DAY}).json()
    assert got["id"] == first["id"]
    assert got["winner_entry_id"] == w2["id"]

    assert client.delete(f"/api/waitlist/{w1['id']}").status_code == 204
    assert client.delete(f"/api/waitlist/{w2['id']}").status_code == 204


def test_lottery_draw_defaults_to_today():
    winner = _add_party("Action Lotto Today")
    try:
        r = client.post("/api/lottery/draw", json={"winner_entry_id": winner["id"]})
        assert r.status_code == 200, r.text
        assert r.json()["lottery_date"] == TODAY
    finally:
        assert client.delete(f"/api/waitlist/{winner['id']}").status_code == 204


def test_settings_roundtrip_and_validation():
    original = client.get("/api/settings").json()
    try:
        r = client.put(
            "/api/settings",
            json={
                "id": 1,
                "restaurant_name": "Action House",
                "table_count": 20,
                "default_wait_estimate": 10,
                "buddha_blessing_threshold": 25,
            },
        )
        assert r.status_code == 200, r.text
        assert r.json()["restaurant_name"] == "Action House"

        assert client.get("/api/settings").json()["table_count"] == 20

        r = client.put(
            "/api/settings",
            json={
                "id": 1,
                "restaurant_name": "   ",
                "table_count": 20,
                "default_wait_estimate": 10,
                "buddha_blessing_threshold": 25,
            },
        )
        assert r.status_code == 200, r.text
        assert r.json()["restaurant_name"] == "Sawasdee"

        assert (
            client.put(
                "/api/settings",
                json={
                    "id": 1,
                    "restaurant_name": "Bad",
                    "table_count": 0,
                    "default_wait_estimate": 10,
                    "buddha_blessing_threshold": 25,
                },
            ).status_code
            == 422
        )
    finally:
        r = client.put("/api/settings", json=original)
        assert r.status_code == 200, r.text


def test_reservation_create_and_list():
    r = client.post(
        "/api/reservations",
        json={
            "name": "Action Reserve",
            "party_size": 3,
            "phone": "081-000-0002",
            "reservation_date": TODAY,
            "reservation_time": "18:30:00",
            "table_number": 7,
            "notes": "birthday",
        },
    )
    assert r.status_code == 201, r.text
    res = r.json()
    assert res["status"] == "confirmed"
    assert 1 <= res["lucky_number"] <= 99
    assert res["created_at"]
    assert res["table_number"] == 7

    ids = [x["id"] for x in client.get("/api/reservations").json()]
    assert res["id"] in ids
    assert client.delete(f"/api/reservations/{res['id']}").status_code == 204


def test_reservation_create_validation():
    base = {"name": "X", "reservation_date": TODAY, "reservation_time": "19:00:00"}
    assert client.post("/api/reservations", json={**base, "name": ""}).status_code == 422
    assert client.post("/api/reservations", json={**base, "party_size": 0}).status_code == 422
    assert client.post("/api/reservations", json={**base, "table_number": 99}).status_code == 422


def test_reservations_list_in_date_time_order():
    later = client.post(
        "/api/reservations",
        json={"name": "Action Later", "party_size": 2, "reservation_date": "2026-03-02", "reservation_time": "19:00:00"},
    ).json()
    earlier = client.post(
        "/api/reservations",
        json={"name": "Action Earlier", "party_size": 2, "reservation_date": "2026-03-01", "reservation_time": "20:00:00"},
    ).json()
    rows = client.get("/api/reservations").json()
    ids = [x["id"] for x in rows]
    assert ids.index(earlier["id"]) < ids.index(later["id"])
    assert client.delete(f"/api/reservations/{later['id']}").status_code == 204
    assert client.delete(f"/api/reservations/{earlier['id']}").status_code == 204


def test_reservation_seat_is_transactional():
    res = client.post(
        "/api/reservations",
        json={
            "name": "Action Seat",
            "party_size": 5,
            "phone": "081-000-0003",
            "reservation_date": TODAY,
            "reservation_time": "18:45:00",
            "notes": "alley",
        },
    ).json()
    r = client.post(f"/api/reservations/{res['id']}/seat", json={"table_number": 9})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["reservation"]["status"] == "seated"
    assert body["reservation"]["table_number"] == 9
    entry = body["waitlist_entry"]
    assert entry["status"] == "seated"
    assert entry["name"] == "Action Seat"
    assert entry["party_size"] == 5
    assert entry["phone"] == "081-000-0003"
    assert entry["table_number"] == 9
    assert entry["wait_minutes"] == 0

    waitlist_ids = [e["id"] for e in client.get("/api/waitlist").json()]
    assert entry["id"] in waitlist_ids

    assert client.delete(f"/api/waitlist/{entry['id']}").status_code == 204
    assert client.delete(f"/api/reservations/{res['id']}").status_code == 204


def test_reservation_cancel_delete_and_404s():
    missing = str(uuid.uuid4())
    assert client.patch(f"/api/reservations/{missing}/cancel").status_code == 404
    assert client.post(f"/api/reservations/{missing}/seat", json={"table_number": 1}).status_code == 404
    assert client.delete(f"/api/reservations/{missing}").status_code == 404

    res = client.post(
        "/api/reservations",
        json={"name": "Action Cancel", "party_size": 2, "reservation_date": TODAY, "reservation_time": "19:30:00"},
    ).json()
    r = client.patch(f"/api/reservations/{res['id']}/cancel")
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "cancelled"
    assert client.delete(f"/api/reservations/{res['id']}").status_code == 204
    ids = [x["id"] for x in client.get("/api/reservations").json()]
    assert res["id"] not in ids
