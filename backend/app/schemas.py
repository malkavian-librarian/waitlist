from datetime import date, datetime, time
from pydantic import BaseModel, Field


class WaitlistEntry(BaseModel):
    id: str
    name: str
    party_size: int
    phone: str | None = None
    status: str
    table_number: int | None = None
    lucky_number: int
    spice_roulette: str | None = None
    joined_at: datetime
    seated_at: datetime | None = None
    wait_minutes: int | None = None
    notes: str | None = None

    model_config = {"from_attributes": True}


class WaitlistCreate(BaseModel):
    name: str = Field(min_length=1)
    party_size: int = Field(default=2, ge=1, le=20)
    phone: str | None = None
    notes: str | None = None


class WaitlistSeat(BaseModel):
    table_number: int | None = Field(default=None, ge=1, le=50)


class WaitlistSpice(BaseModel):
    result: str = Field(pattern="^(Mild|Medium|Hot|Fire|Volcano)$")


class DailyLottery(BaseModel):
    id: str
    lottery_date: date
    winner_entry_id: str | None = None
    drawn_at: datetime | None = None
    lucky_number: int

    model_config = {"from_attributes": True}


class LotteryDraw(BaseModel):
    winner_entry_id: str
    lottery_date: date | None = None


class RestaurantSettings(BaseModel):
    id: int = 1
    restaurant_name: str = "Sawasdee"
    table_count: int = Field(default=12, ge=1, le=50)
    default_wait_estimate: int = Field(default=15, ge=0, le=120)
    buddha_blessing_threshold: int = Field(default=30, ge=5, le=120)

    model_config = {"from_attributes": True}


class Reservation(BaseModel):
    id: str
    name: str
    party_size: int
    phone: str | None = None
    reservation_date: date
    reservation_time: time
    status: str
    table_number: int | None = None
    notes: str | None = None
    lucky_number: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ReservationCreate(BaseModel):
    name: str = Field(min_length=1)
    party_size: int = Field(default=2, ge=1, le=20)
    phone: str | None = None
    reservation_date: date
    reservation_time: time
    notes: str | None = None
    table_number: int | None = Field(default=None, ge=1, le=50)


class ReservationSeat(BaseModel):
    table_number: int | None = Field(default=None, ge=1, le=50)


class SeatReservationResult(BaseModel):
    reservation: Reservation
    waitlist_entry: WaitlistEntry
