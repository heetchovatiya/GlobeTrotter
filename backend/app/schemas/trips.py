from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.models import ExpenseCategory, SectionType, TripStatus


class TripCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    cover_photo_url: str | None = Field(default=None, max_length=512)
    save_as_draft: bool = False


class TripUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    start_date: date | None = None
    end_date: date | None = None
    description: str | None = None
    cover_photo_url: str | None = Field(default=None, max_length=512)
    is_public: bool | None = None
    status: TripStatus | None = None


class TripPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    name: str
    start_date: date
    end_date: date
    description: str | None
    cover_photo_url: str | None
    status: TripStatus
    is_public: bool


class StopCreate(BaseModel):
    city_id: int
    order_index: int = 0
    arrival_date: date | None = None
    departure_date: date | None = None


class StopUpdate(BaseModel):
    city_id: int | None = None
    order_index: int | None = None
    arrival_date: date | None = None
    departure_date: date | None = None


class StopPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    trip_id: int
    city_id: int
    order_index: int
    arrival_date: date | None
    departure_date: date | None


class SectionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    type: SectionType
    date_range_start: date | None = None
    date_range_end: date | None = None
    budget: float | None = Field(default=None, ge=0)
    notes: str | None = None
    order_index: int = 0
    budget_allocation: str = Field(default="spread_dates", max_length=32)


class SectionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    type: SectionType | None = None
    date_range_start: date | None = None
    date_range_end: date | None = None
    budget: float | None = Field(default=None, ge=0)
    notes: str | None = None
    order_index: int | None = None
    budget_allocation: str | None = Field(default=None, max_length=32)


class SectionPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    stop_id: int
    title: str
    type: SectionType
    date_range_start: date | None
    date_range_end: date | None
    budget: float | None
    notes: str | None
    order_index: int
    budget_allocation: str = "spread_dates"


SECTION_TYPE_TO_EXPENSE: dict[SectionType, ExpenseCategory] = {
    SectionType.travel: ExpenseCategory.transport,
    SectionType.stay: ExpenseCategory.stay,
    SectionType.activity: ExpenseCategory.activities,
    SectionType.other: ExpenseCategory.other,
}
