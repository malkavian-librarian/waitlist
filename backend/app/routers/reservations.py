from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Reservation, WaitlistEntry
from ..schemas import (
    Reservation as ReservationSchema,
    ReservationCreate,
    ReservationSeat,
    SeatReservationResult,
)

router = APIRouter(prefix="/api/reservations", tags=["reservations"])


def _get_or_404(db: Session, res_id: str) -> Reservation:
    row = db.get(Reservation, res_id)
    if row is None:
        raise HTTPException(status_code=404, detail="reservation not found")
    return row


@router.get("", response_model=list[ReservationSchema])
def list_reservations(db: Session = Depends(get_db)):
    rows = (
        db.execute(
            select(Reservation).order_by(Reservation.reservation_date, Reservation.reservation_time)
        )
        .scalars()
        .all()
    )
    return rows


@router.post("", response_model=ReservationSchema, status_code=201)
def create_reservation(payload: ReservationCreate, db: Session = Depends(get_db)):
    row = Reservation(
        name=payload.name.strip(),
        party_size=payload.party_size,
        phone=payload.phone or None,
        reservation_date=payload.reservation_date,
        reservation_time=payload.reservation_time,
        notes=payload.notes or None,
        table_number=payload.table_number,
        status="confirmed",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.patch("/{res_id}/cancel", response_model=ReservationSchema)
def cancel_reservation(res_id: str, db: Session = Depends(get_db)):
    row = _get_or_404(db, res_id)
    row.status = "cancelled"
    db.commit()
    db.refresh(row)
    return row


@router.post("/{res_id}/seat", response_model=SeatReservationResult)
def seat_reservation(res_id: str, payload: ReservationSeat, db: Session = Depends(get_db)):
    row = _get_or_404(db, res_id)
    table = payload.table_number if payload.table_number else row.table_number
    row.status = "seated"
    row.table_number = table
    entry = WaitlistEntry(
        name=row.name,
        party_size=row.party_size,
        phone=row.phone,
        status="seated",
        table_number=table,
        notes=f"Reservation {row.reservation_time}. {row.notes}" if row.notes else f"Reservation {row.reservation_time}",
        seated_at=datetime.utcnow(),
        wait_minutes=0,
    )
    db.add(entry)
    db.commit()
    db.refresh(row)
    db.refresh(entry)
    return {"reservation": row, "waitlist_entry": entry}


@router.delete("/{res_id}", status_code=204)
def delete_reservation(res_id: str, db: Session = Depends(get_db)):
    row = _get_or_404(db, res_id)
    db.delete(row)
    db.commit()
    return None
