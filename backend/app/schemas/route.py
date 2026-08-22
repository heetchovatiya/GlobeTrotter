from datetime import date

from pydantic import BaseModel


class RouteStop(BaseModel):
    order_index: int
    city_id: int
    city_name: str
    country: str
    latitude: float
    longitude: float
    arrival_date: date | None = None
    departure_date: date | None = None


class TripRouteResponse(BaseModel):
    trip_id: int
    trip_name: str
    stops: list[RouteStop]
