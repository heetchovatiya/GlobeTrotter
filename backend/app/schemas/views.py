from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models import ActivityType, ExpenseCategory, SectionType, TripStatus


class CityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    country: str
    cost_index: float
    popularity_score: int
    image_url: str | None = None


class ActivityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    city_id: int
    name: str
    type: ActivityType
    cost: float
    duration_mins: int
    description: str | None = None
    image_url: str | None = None


class TripActivityPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    activity_id: int | None = None
    scheduled_date: date | None = None
    scheduled_time: str | None = None
    cost_override: float | None = None
    custom_label: str | None = None
    activity: ActivityPublic | None = None


class ItinerarySection(BaseModel):
    id: int
    stop_id: int
    city_id: int
    city_name: str | None = None
    title: str
    type: SectionType
    date_range_start: date | None = None
    date_range_end: date | None = None
    budget: float | None = None
    notes: str | None = None
    order_index: int
    budget_allocation: str = "spread_dates"
    activities: list[TripActivityPublic] = Field(default_factory=list)


class ItineraryDay(BaseModel):
    date: date
    city_id: int | None = None
    city_name: str | None = None
    sections: list[ItinerarySection] = Field(default_factory=list)


class ItineraryResponse(BaseModel):
    trip_id: int
    name: str
    start_date: date
    end_date: date
    status: TripStatus
    days: list[ItineraryDay]


class CategoryTotal(BaseModel):
    category: ExpenseCategory
    total: float


class DayBudget(BaseModel):
    date: date
    estimated: float
    actual: float


class BudgetResponse(BaseModel):
    trip_id: int
    by_category: list[CategoryTotal]
    by_day: list[DayBudget]
    overbudget_days: list[date]
    itinerary_stay: float = 0
    itinerary_transport: float = 0
    itinerary_activities: float = 0
    itinerary_total: float = 0
    general_spent: float = 0
    grand_total: float = 0


class ShareResponse(BaseModel):
    trip_id: int
    public_slug: str


class CopyTripResponse(BaseModel):
    trip_id: int


def as_float(value: Decimal | float | int | None) -> float | None:
    if value is None:
        return None
    return float(value)
