import random
import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Integer, String, Text, Time
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _lucky() -> int:
    return random.randint(1, 99)


class WaitlistEntry(Base):
    __tablename__ = "waitlist_entries"
    __table_args__ = (
        CheckConstraint("party_size >= 1 AND party_size <= 20", name="ck_waitlist_party_size"),
        CheckConstraint("status IN ('waiting','seated','completed','no_show')", name="ck_waitlist_status"),
        CheckConstraint("lucky_number >= 1 AND lucky_number <= 99", name="ck_waitlist_lucky"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="waiting")
    table_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lucky_number: Mapped[int] = mapped_column(Integer, nullable=False, default=_lucky)
    spice_roulette: Mapped[str | None] = mapped_column(String(20), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    seated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    wait_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class DailyLottery(Base):
    __tablename__ = "daily_lottery"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    lottery_date: Mapped[str] = mapped_column(Date, nullable=False, unique=True)
    winner_entry_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    drawn_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    lucky_number: Mapped[int] = mapped_column(Integer, nullable=False, default=_lucky)


class RestaurantSettings(Base):
    __tablename__ = "restaurant_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    restaurant_name: Mapped[str] = mapped_column(Text, nullable=False, default="Sawasdee")
    table_count: Mapped[int] = mapped_column(Integer, nullable=False, default=12)
    default_wait_estimate: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    buddha_blessing_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=30)


class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("party_size >= 1 AND party_size <= 20", name="ck_res_party_size"),
        CheckConstraint(
            "status IN ('confirmed','seated','cancelled','no_show')", name="ck_res_status"
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    reservation_date: Mapped[str] = mapped_column(Date, nullable=False)
    reservation_time: Mapped[str] = mapped_column(Time, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmed")
    table_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    lucky_number: Mapped[int] = mapped_column(Integer, nullable=False, default=_lucky)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
