from datetime import date, datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DailyLottery
from ..schemas import DailyLottery as LotterySchema, LotteryDraw

router = APIRouter(prefix="/api/lottery", tags=["lottery"])


@router.get("", response_model=LotterySchema | None)
def get_lottery(lottery_date: date | None = None, db: Session = Depends(get_db)):
    day = lottery_date or date.today()
    row = db.execute(select(DailyLottery).where(DailyLottery.lottery_date == day)).scalar_one_or_none()
    return row


@router.post("/draw", response_model=LotterySchema)
def draw_lottery(payload: LotteryDraw, db: Session = Depends(get_db)):
    day = payload.lottery_date or date.today()
    row = db.execute(select(DailyLottery).where(DailyLottery.lottery_date == day)).scalar_one_or_none()
    if row is None:
        row = DailyLottery(lottery_date=day, winner_entry_id=payload.winner_entry_id, drawn_at=datetime.utcnow())
        db.add(row)
    else:
        row.winner_entry_id = payload.winner_entry_id
        row.drawn_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return row
