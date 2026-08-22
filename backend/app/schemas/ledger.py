from datetime import date

from pydantic import BaseModel, Field

from app.models import TripStatus


class LedgerRow(BaseModel):
    trip_id: int
    trip_name: str
    status: TripStatus
    start_date: date
    end_date: date
    planned_budget: float
    total_spent: float
    variance: float


class LedgerTotals(BaseModel):
    trip_count: int
    total_planned: float
    total_spent: float
    total_variance: float


class TravelLedgerResponse(BaseModel):
    rows: list[LedgerRow]
    totals: LedgerTotals
    filters_applied: dict[str, str | None] = Field(default_factory=dict)
