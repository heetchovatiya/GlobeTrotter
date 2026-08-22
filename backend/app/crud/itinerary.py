from collections import defaultdict
from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.crud.trips import get_owned_trip, resolve_trip_status
from app.models import Stop, Trip, TripActivity, TripSection, User
from app.schemas.views import (
    ActivityPublic,
    ItineraryDay,
    ItineraryResponse,
    ItinerarySection,
    TripActivityPublic,
    as_float,
)


def _load_trip_tree(db: Session, trip_id: int) -> Trip | None:
    return (
        db.query(Trip)
        .options(
            selectinload(Trip.stops).selectinload(Stop.city),
            selectinload(Trip.stops)
            .selectinload(Stop.sections)
            .selectinload(TripSection.trip_activities)
            .selectinload(TripActivity.activity),
        )
        .filter(Trip.id == trip_id)
        .first()
    )


def get_owned_trip_tree(db: Session, trip_id: int, user: User) -> Trip:
    trip = get_owned_trip(db, trip_id, user)
    loaded = _load_trip_tree(db, trip.id)
    if loaded is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return loaded


def get_trip_tree_by_id(db: Session, trip_id: int) -> Trip:
    loaded = _load_trip_tree(db, trip_id)
    if loaded is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return loaded


def _section_to_public(section: TripSection, city_id: int, city_name: str | None) -> ItinerarySection:
    activities: list[TripActivityPublic] = []
    for item in sorted(
        section.trip_activities,
        key=lambda a: (a.scheduled_date or date.min, a.id),
    ):
        activities.append(
            TripActivityPublic(
                id=item.id,
                activity_id=item.activity_id,
                scheduled_date=item.scheduled_date,
                scheduled_time=item.scheduled_time.isoformat() if item.scheduled_time else None,
                cost_override=as_float(item.cost_override),
                custom_label=item.custom_label,
                activity=ActivityPublic.model_validate(item.activity) if item.activity else None,
            )
        )
    return ItinerarySection(
        id=section.id,
        stop_id=section.stop_id,
        city_id=city_id,
        city_name=city_name,
        title=section.title,
        type=section.type,
        date_range_start=section.date_range_start,
        date_range_end=section.date_range_end,
        budget=as_float(section.budget),
        notes=section.notes,
        order_index=section.order_index,
        activities=activities,
    )


def build_itinerary_response(trip: Trip) -> ItineraryResponse:
    days_map: dict[date, list[ItinerarySection]] = defaultdict(list)

    for stop in sorted(trip.stops, key=lambda s: s.order_index):
        city_name = stop.city.name if stop.city else None
        for section in sorted(stop.sections, key=lambda s: s.order_index):
            payload = _section_to_public(section, stop.city_id, city_name)
            start = section.date_range_start or trip.start_date
            end = section.date_range_end or start
            if end < start:
                end = start
            current = start
            while current <= end:
                days_map[current].append(payload)
                current += timedelta(days=1)

    days = [
        ItineraryDay(date=day, sections=sections)
        for day, sections in sorted(days_map.items(), key=lambda item: item[0])
    ]
    return ItineraryResponse(
        trip_id=trip.id,
        name=trip.name,
        start_date=trip.start_date,
        end_date=trip.end_date,
        status=resolve_trip_status(trip),
        days=days,
    )
