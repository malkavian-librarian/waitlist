from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RestaurantSettings
from ..schemas import RestaurantSettings as SettingsSchema

router = APIRouter(prefix="/api/settings", tags=["settings"])

DEFAULTS = {
    "id": 1,
    "restaurant_name": "Sawasdee",
    "table_count": 12,
    "default_wait_estimate": 15,
    "buddha_blessing_threshold": 30,
}


def _get_or_create(db: Session) -> RestaurantSettings:
    row = db.get(RestaurantSettings, 1)
    if row is None:
        row = RestaurantSettings(**DEFAULTS)
        db.add(row)
        db.commit()
        db.refresh(row)
    return row


@router.get("", response_model=SettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    return _get_or_create(db)


@router.put("", response_model=SettingsSchema)
def save_settings(payload: SettingsSchema, db: Session = Depends(get_db)):
    row = _get_or_create(db)
    row.restaurant_name = payload.restaurant_name.strip() or "Sawasdee"
    row.table_count = payload.table_count
    row.default_wait_estimate = payload.default_wait_estimate
    row.buddha_blessing_threshold = payload.buddha_blessing_threshold
    db.commit()
    db.refresh(row)
    return row
