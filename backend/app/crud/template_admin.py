import re
import unicodedata

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.models import City, CommunityPost, Stop, Trip, TripTemplate, User
from app.schemas.templates import TemplateSectionSpec


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9]+", "-", normalized.lower()).strip("-")
    return (slug[:58] or "template").strip("-")


def _unique_template_id(db: Session, base: str) -> str:
    candidate = base
    n = 2
    while db.query(TripTemplate).filter(TripTemplate.id == candidate).first():
        candidate = f"{base}-{n}"
        n += 1
    return candidate


def list_templates(db: Session, q: str | None = None, include_inactive: bool = False) -> list[TripTemplate]:
    query = db.query(TripTemplate)
    if not include_inactive:
        query = query.filter(TripTemplate.is_active.is_(True))
    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(TripTemplate.name).like(term),
                func.lower(TripTemplate.id).like(term),
            )
        )
    return query.order_by(TripTemplate.created_at.desc()).all()


def get_template_row(db: Session, template_id: str) -> TripTemplate | None:
    return db.query(TripTemplate).filter(TripTemplate.id == template_id).first()


def create_template(
    db: Session,
    *,
    template_id: str | None,
    name: str,
    description: str,
    duration_days: int,
    city_names: list[str],
    sections: list[dict],
    source_trip_id: int | None = None,
    source_post_id: int | None = None,
) -> TripTemplate:
    tid = _unique_template_id(db, template_id or slugify(name))
    row = TripTemplate(
        id=tid,
        name=name.strip(),
        description=description.strip(),
        duration_days=duration_days,
        city_names=city_names,
        sections=sections,
        source_trip_id=source_trip_id,
        source_post_id=source_post_id,
        is_active=True,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_template(db: Session, row: TripTemplate, payload: dict) -> TripTemplate:
    for key, value in payload.items():
        if value is not None:
            setattr(row, key, value)
    db.commit()
    db.refresh(row)
    return row


def delete_template(db: Session, row: TripTemplate) -> None:
    db.delete(row)
    db.commit()


def _load_trip_for_template(db: Session, trip_id: int) -> Trip | None:
    return (
        db.query(Trip)
        .options(
            selectinload(Trip.stops).selectinload(Stop.city),
            selectinload(Trip.stops).selectinload(Stop.sections),
        )
        .filter(Trip.id == trip_id)
        .first()
    )


def trip_to_template_data(trip: Trip) -> dict:
    stops = sorted(trip.stops, key=lambda s: s.order_index)
    city_names = [stop.city.name for stop in stops if stop.city]
    duration_days = (trip.end_date - trip.start_date).days + 1
    sections: list[dict] = []
    order = 0
    for stop in stops:
        for section in sorted(stop.sections, key=lambda s: s.order_index):
            order += 1
            day_offset = 0
            if section.date_range_start:
                day_offset = max(0, (section.date_range_start - trip.start_date).days)
            day_offset = min(day_offset, max(duration_days - 1, 0))
            sections.append(
                TemplateSectionSpec(
                    title=section.title,
                    type=section.type,
                    day_offset=day_offset,
                    budget=float(section.budget or 0),
                    notes=section.notes,
                ).model_dump(mode="json")
            )
    return {
        "name": trip.name,
        "description": trip.description or f"Template from trip: {trip.name}",
        "duration_days": duration_days,
        "city_names": city_names,
        "sections": sections,
    }


def template_from_trip(
    db: Session,
    trip_id: int,
    *,
    template_id: str | None = None,
    name: str | None = None,
    source_post_id: int | None = None,
) -> TripTemplate:
    trip = _load_trip_for_template(db, trip_id)
    if trip is None:
        raise ValueError("Trip not found")
    data = trip_to_template_data(trip)
    if not data["city_names"]:
        raise ValueError("Trip has no cities — cannot build template")
    return create_template(
        db,
        template_id=template_id,
        name=name or data["name"],
        description=data["description"],
        duration_days=data["duration_days"],
        city_names=data["city_names"],
        sections=data["sections"],
        source_trip_id=trip.id,
        source_post_id=source_post_id,
    )


def template_from_community_post(db: Session, post_id: int, name: str | None = None) -> TripTemplate:
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if post is None:
        raise ValueError("Post not found")
    if post.trip_id is None:
        raise ValueError("Post has no linked itinerary")
    trip = _load_trip_for_template(db, post.trip_id)
    resolved_name = name or (trip.name if trip else f"Template from post #{post.id}")
    return template_from_trip(
        db,
        post.trip_id,
        name=resolved_name,
        source_post_id=post.id,
    )
