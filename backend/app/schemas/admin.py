from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.auth import UserPublic


class AdminUserPublic(UserPublic):
    model_config = ConfigDict(from_attributes=True)


class SuspendRequest(BaseModel):
    suspended: bool = True


class CityAnalyticsItem(BaseModel):
    city_id: int
    name: str
    country: str
    trip_count: int


class ActivityAnalyticsItem(BaseModel):
    activity_id: int
    name: str
    city_id: int
    booking_count: int


class TrendPoint(BaseModel):
    date: date
    trips_created: int


class TrendsResponse(BaseModel):
    trips_over_time: list[TrendPoint]
    active_users: int
    total_trips: int
    total_users: int
