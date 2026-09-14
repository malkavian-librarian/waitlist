from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import WaitlistEntry
from ..schemas import WaitlistCreate, WaitlistEntry as WaitlistEntrySchema, WaitlistSeat, WaitlistSpice

router = APIRouter(prefix="/api/waitlist", tags=["waitlist"])

VALID_TRANSITIONS = {"waiting", "seated", "completed", "no_show"}


def _get_or_404(db: Session, entry_id: str) -> WaitlistEntry:
    entry = db.get(WaitlistEntry, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="waitlist entry not found")
    return entry


@router.get("", response_model=list[WaitlistEntrySchema])
def list_entries(db: Session = Depends(get_db)):
    rows = db.execute(select(WaitlistEntry).order_by(WaitlistEntry.joined_at)).scalars().all()
    return rows


@router.post("", response_model=WaitlistEntrySchema, status_code=201)
def create_entry(payload: WaitlistCreate, db: Session = Depends(get_db)):
    entry = WaitlistEntry(
        name=payload.name.strip(),
        party_size=payload.party_size,
        phone=payload.phone or None,
        notes=payload.notes or None,
        status="waiting",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}/seat", response_model=WaitlistEntrySchema)
def seat_entry(entry_id: str, payload: WaitlistSeat, db: Session = Depends(get_db)):
    entry = _get_or_404(db, entry_id)
    wait_ms = (datetime.utcnow() - entry.joined_at).total_seconds() * 1000
    entry.status = "seated"
    entry.table_number = payload.table_number if payload.table_number else entry.table_number
    entry.seated_at = datetime.utcnow()
    entry.wait_minutes = max(0, int(wait_ms // 60000))
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}/status", response_model=WaitlistEntrySchema)
def set_status(entry_id: str, payload: dict, db: Session = Depends(get_db)):
    status = payload.get("status")
    if status not in VALID_TRANSITIONS:
        raise HTTPException(status_code=400, detail="invalid status")
    entry = _get_or_404(db, entry_id)
    entry.status = status
    db.commit()
    db.refresh(entry)
    return entry


@router.patch("/{entry_id}/spice", response_model=WaitlistEntrySchema)
def set_spice(entry_id: str, payload: WaitlistSpice, db: Session = Depends(get_db)):
    entry = _get_or_404(db, entry_id)
    entry.spice_roulette = payload.result
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: str, db: Session = Depends(get_db)):
    entry = _get_or_404(db, entry_id)
    db.delete(entry)
    db.commit()
    return None
