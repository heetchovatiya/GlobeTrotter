from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.itinerary import get_owned_trip_tree
from app.data.city_coordinates import get_coordinates
from app.models import User
from app.schemas.route import RouteStop, TripRouteResponse


def get_trip_route(db: Session, trip_id: int, user: User) -> TripRouteResponse:
    trip = get_owned_trip_tree(db, trip_id, user)
    stops: list[RouteStop] = []
    for stop in sorted(trip.stops, key=lambda s: s.order_index):
        city = stop.city
        if city is None:
            continue
        coords = get_coordinates(city.name, city.country)
        if coords is None:
            continue
        lat, lng = coords
        stops.append(
            RouteStop(
                order_index=stop.order_index,
                city_id=city.id,
                city_name=city.name,
                country=city.country,
                latitude=lat,
                longitude=lng,
                arrival_date=stop.arrival_date,
                departure_date=stop.departure_date,
            )
        )

    if not stops:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No mappable stops found for this trip",
        )

    return TripRouteResponse(trip_id=trip.id, trip_name=trip.name, stops=stops)
