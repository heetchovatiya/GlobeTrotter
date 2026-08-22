import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.crud.itinerary import build_itinerary_response, get_trip_tree_by_id
from app.crud.trips import derive_trip_status, get_owned_trip
from app.models import (
    Expense,
    SharedTrip,
    Stop,
    Trip,
    TripActivity,
    TripSection,
    User,
)
from app.schemas.views import CopyTripResponse, ItineraryResponse, ShareResponse


def _unique_slug(db: Session) -> str:
    for _ in range(8):
        slug = secrets.token_urlsafe(6).replace("-", "").replace("_", "")[:10]
        exists = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
        if exists is None:
            return slug
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate share slug",
    )


def share_trip(db: Session, trip_id: int, user: User) -> ShareResponse:
    trip = get_owned_trip(db, trip_id, user)
    existing = db.query(SharedTrip).filter(SharedTrip.trip_id == trip.id).first()
    if existing is not None:
        return ShareResponse(trip_id=trip.id, public_slug=existing.public_slug)

    shared = SharedTrip(trip_id=trip.id, public_slug=_unique_slug(db))
    trip.is_public = True
    db.add(shared)
    db.commit()
    db.refresh(shared)
    return ShareResponse(trip_id=trip.id, public_slug=shared.public_slug)


def get_shared_itinerary(db: Session, slug: str) -> ItineraryResponse:
    shared = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
    if shared is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared trip not found")
    trip = get_trip_tree_by_id(db, shared.trip_id)
    return build_itinerary_response(trip)


def copy_shared_trip(db: Session, slug: str, user: User) -> CopyTripResponse:
    shared = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
    if shared is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared trip not found")

    source = (
        db.query(Trip)
        .options(
            selectinload(Trip.stops).selectinload(Stop.sections).selectinload(TripSection.trip_activities),
            selectinload(Trip.expenses),
        )
        .filter(Trip.id == shared.trip_id)
        .first()
    )
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    cloned = Trip(
        user_id=user.id,
        name=f"Copy of {source.name}",
        start_date=source.start_date,
        end_date=source.end_date,
        description=source.description,
        cover_photo_url=source.cover_photo_url,
        status=derive_trip_status(source.start_date, source.end_date),
        is_public=False,
    )
    db.add(cloned)
    db.flush()

    section_id_map: dict[int, int] = {}
    for stop in sorted(source.stops, key=lambda s: s.order_index):
        new_stop = Stop(
            trip_id=cloned.id,
            city_id=stop.city_id,
            order_index=stop.order_index,
            arrival_date=stop.arrival_date,
            departure_date=stop.departure_date,
        )
        db.add(new_stop)
        db.flush()
        for section in sorted(stop.sections, key=lambda s: s.order_index):
            new_section = TripSection(
                stop_id=new_stop.id,
                title=section.title,
                type=section.type,
                date_range_start=section.date_range_start,
                date_range_end=section.date_range_end,
                budget=section.budget,
                notes=section.notes,
                order_index=section.order_index,
            )
            db.add(new_section)
            db.flush()
            section_id_map[section.id] = new_section.id
            for activity in section.trip_activities:
                db.add(
                    TripActivity(
                        section_id=new_section.id,
                        activity_id=activity.activity_id,
                        scheduled_date=activity.scheduled_date,
                        scheduled_time=activity.scheduled_time,
                        cost_override=activity.cost_override,
                        custom_label=activity.custom_label,
                    )
                )

    for expense in source.expenses:
        db.add(
            Expense(
                trip_id=cloned.id,
                category=expense.category,
                amount=expense.amount,
                section_id=section_id_map.get(expense.section_id) if expense.section_id else None,
            )
        )

    db.commit()
    db.refresh(cloned)
    return CopyTripResponse(trip_id=cloned.id)
