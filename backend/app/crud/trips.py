from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models import Expense, SectionType, Stop, Trip, TripSection, TripStatus, User
from app.schemas.trips import (
    SECTION_TYPE_TO_EXPENSE,
    SectionCreate,
    SectionUpdate,
    StopCreate,
    StopUpdate,
    TripCreate,
    TripUpdate,
)


def derive_trip_status(start_date: date, end_date: date, today: date | None = None) -> TripStatus:
    today = today or date.today()
    if today > end_date:
        return TripStatus.completed
    if start_date <= today <= end_date:
        return TripStatus.ongoing
    return TripStatus.planning


def resolve_trip_status(trip: Trip, today: date | None = None) -> TripStatus:
    if trip.status == TripStatus.draft:
        return TripStatus.draft
    return derive_trip_status(trip.start_date, trip.end_date, today)


def _default_draft_dates(today: date | None = None) -> tuple[date, date]:
    today = today or date.today()
    return today, today + timedelta(days=7)


def get_owned_trip(db: Session, trip_id: int, user: User) -> Trip:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    if trip.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")
    return trip


def list_trips_for_user(
    db: Session,
    user: User,
    status_filter: str | None = None,
    sort: str | None = None,
    limit: int | None = None,
) -> list[Trip]:
    trips = db.query(Trip).filter(Trip.user_id == user.id).all()
    for trip in trips:
        trip.status = resolve_trip_status(trip)

    if status_filter:
        if status_filter == "upcoming":
            trips = [t for t in trips if t.status == TripStatus.planning]
        else:
            try:
                wanted = TripStatus(status_filter)
            except ValueError as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid status filter",
                ) from exc
            trips = [t for t in trips if t.status == wanted]

    sort_key = (sort or "start_date_desc").lower()
    if sort_key in {"start_date", "start_date_asc"}:
        trips.sort(key=lambda t: (t.start_date, t.id))
    elif sort_key in {"start_date_desc", "recent"}:
        trips.sort(key=lambda t: (t.start_date, t.id), reverse=True)
    elif sort_key in {"end_date", "end_date_asc"}:
        trips.sort(key=lambda t: (t.end_date, t.id))
    elif sort_key == "name":
        trips.sort(key=lambda t: (t.name.lower(), t.id))
    elif sort_key == "created_at":
        trips.sort(key=lambda t: (t.created_at, t.id), reverse=True)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid sort. Use start_date, start_date_desc, end_date, name, or created_at",
        )

    if limit is not None:
        trips = trips[:limit]
    return trips


def create_trip(db: Session, user: User, data: TripCreate) -> Trip:
    if data.save_as_draft:
        start_date, end_date = data.start_date, data.end_date
        if start_date is None or end_date is None:
            start_date, end_date = _default_draft_dates()
        trip_status = TripStatus.draft
    else:
        if data.start_date is None or data.end_date is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="start_date and end_date are required",
            )
        start_date, end_date = data.start_date, data.end_date
        trip_status = derive_trip_status(start_date, end_date)

    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be on or after start_date",
        )
    trip = Trip(
        user_id=user.id,
        name=data.name,
        start_date=start_date,
        end_date=end_date,
        description=data.description,
        cover_photo_url=data.cover_photo_url,
        status=trip_status,
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def update_trip(db: Session, trip: Trip, data: TripUpdate) -> Trip:
    payload = data.model_dump(exclude_unset=True)
    requested_status = payload.pop("status", None)
    for key, value in payload.items():
        setattr(trip, key, value)
    if trip.end_date < trip.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="end_date must be on or after start_date",
        )
    if requested_status is not None:
        if requested_status == TripStatus.draft:
            trip.status = TripStatus.draft
        elif trip.status == TripStatus.draft and requested_status == TripStatus.planning:
            trip.status = derive_trip_status(trip.start_date, trip.end_date)
        else:
            trip.status = requested_status
    elif trip.status != TripStatus.draft:
        trip.status = derive_trip_status(trip.start_date, trip.end_date)
    db.commit()
    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip: Trip) -> None:
    db.delete(trip)
    db.commit()


def create_stop(db: Session, trip: Trip, data: StopCreate) -> Stop:
    if data.arrival_date and data.departure_date and data.departure_date < data.arrival_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="departure_date must be on or after arrival_date",
        )
    if data.arrival_date and data.arrival_date < trip.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="arrival_date cannot be before trip start_date",
        )
    if data.departure_date and data.departure_date > trip.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="departure_date cannot be after trip end_date",
        )
    stop = Stop(
        trip_id=trip.id,
        city_id=data.city_id,
        order_index=data.order_index,
        arrival_date=data.arrival_date,
        departure_date=data.departure_date,
    )
    db.add(stop)
    db.commit()
    db.refresh(stop)
    return stop


def get_owned_stop(db: Session, trip: Trip, stop_id: int) -> Stop:
    stop = db.query(Stop).filter(Stop.id == stop_id, Stop.trip_id == trip.id).first()
    if stop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found")
    return stop


def update_stop(db: Session, stop: Stop, data: StopUpdate) -> Stop:
    payload = data.model_dump(exclude_unset=True)
    arrival = payload.get("arrival_date", stop.arrival_date)
    departure = payload.get("departure_date", stop.departure_date)
    if arrival and departure and departure < arrival:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="departure_date must be on or after arrival_date",
        )
    trip = db.query(Trip).filter(Trip.id == stop.trip_id).first()
    if trip:
        if arrival and arrival < trip.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="arrival_date cannot be before trip start_date",
            )
        if departure and departure > trip.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="departure_date cannot be after trip end_date",
            )
    for key, value in payload.items():
        setattr(stop, key, value)
    db.commit()
    db.refresh(stop)
    return stop


def delete_stop(db: Session, stop: Stop) -> None:
    db.delete(stop)
    db.commit()


def _upsert_section_expense(
    db: Session,
    trip_id: int,
    section: TripSection,
    section_type: SectionType,
    budget: float | None,
) -> None:
    existing = (
        db.query(Expense)
        .filter(Expense.section_id == section.id, Expense.trip_id == trip_id)
        .first()
    )
    if budget is None:
        if existing is not None:
            db.delete(existing)
        return

    category = SECTION_TYPE_TO_EXPENSE[section_type]
    if existing is None:
        db.add(
            Expense(
                trip_id=trip_id,
                section_id=section.id,
                category=category,
                amount=budget,
            )
        )
    else:
        existing.category = category
        existing.amount = budget


def _validate_section_dates(
    trip: Trip,
    start: date | None,
    end: date | None,
) -> None:
    if start and end and end < start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_range_end must be on or after date_range_start",
        )
    if start and start < trip.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_range_start cannot be before trip start_date",
        )
    if end and end > trip.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="date_range_end cannot be after trip end_date",
        )


def create_section(db: Session, trip: Trip, stop: Stop, data: SectionCreate) -> TripSection:
    _validate_section_dates(trip, data.date_range_start, data.date_range_end)
    section = TripSection(
        stop_id=stop.id,
        title=data.title,
        type=data.type,
        date_range_start=data.date_range_start,
        date_range_end=data.date_range_end,
        budget=data.budget,
        notes=data.notes,
        order_index=data.order_index,
    )
    db.add(section)
    db.flush()
    _upsert_section_expense(db, trip.id, section, data.type, data.budget)
    db.commit()
    db.refresh(section)
    return section


def get_section(db: Session, section_id: int) -> TripSection:
    section = db.query(TripSection).filter(TripSection.id == section_id).first()
    if section is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found")
    return section


def get_owned_section(db: Session, section_id: int, user: User) -> tuple[Trip, TripSection]:
    section = get_section(db, section_id)
    stop = db.query(Stop).filter(Stop.id == section.stop_id).first()
    if stop is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stop not found")
    trip = get_owned_trip(db, stop.trip_id, user)
    return trip, section


def update_section(db: Session, trip: Trip, section: TripSection, data: SectionUpdate) -> TripSection:
    payload = data.model_dump(exclude_unset=True)
    start = payload.get("date_range_start", section.date_range_start)
    end = payload.get("date_range_end", section.date_range_end)
    _validate_section_dates(trip, start, end)
    for key, value in payload.items():
        setattr(section, key, value)
    _upsert_section_expense(db, trip.id, section, section.type, section.budget)
    db.commit()
    db.refresh(section)
    return section


def delete_section(db: Session, section: TripSection) -> None:
    db.delete(section)
    db.commit()
