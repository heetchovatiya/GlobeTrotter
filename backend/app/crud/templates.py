"""Predefined trip templates (city names must exist in seed data)."""

from __future__ import annotations

from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.trips import _upsert_section_expense, derive_trip_status
from app.models import City, SectionType, Stop, Trip, TripSection, User
from app.schemas.templates import TemplateInstantiate, TemplatePublic, TemplateSectionSpec
from app.utils.trip_dates import split_trip_dates_for_stops


class TripTemplateDef:
    def __init__(
        self,
        id: str,
        name: str,
        description: str,
        duration_days: int,
        city_names: list[str],
        sections: list[TemplateSectionSpec],
    ):
        self.id = id
        self.name = name
        self.description = description
        self.duration_days = duration_days
        self.city_names = city_names
        self.sections = sections


TEMPLATES: list[TripTemplateDef] = [
    TripTemplateDef(
        id="weekend-goa",
        name="Weekend in Goa",
        description="3-day beach break with shacks, sunsets, and Old Goa heritage.",
        duration_days=3,
        city_names=["Goa"],
        sections=[
            TemplateSectionSpec(title="Arrival & beach check-in", type=SectionType.travel, day_offset=0, budget=120),
            TemplateSectionSpec(title="North Goa beach day", type=SectionType.activity, day_offset=1, budget=80),
            TemplateSectionSpec(title="Old Goa & departure", type=SectionType.activity, day_offset=2, budget=60),
        ],
    ),
    TripTemplateDef(
        id="golden-triangle",
        name="Golden Triangle",
        description="Classic 7-day Delhi → Agra → Jaipur circuit.",
        duration_days=7,
        city_names=["Delhi", "Agra", "Jaipur"],
        sections=[
            TemplateSectionSpec(title="Delhi arrival & city tour", type=SectionType.travel, day_offset=0, budget=150),
            TemplateSectionSpec(title="Delhi monuments", type=SectionType.activity, day_offset=1, budget=90),
            TemplateSectionSpec(title="Travel to Agra", type=SectionType.travel, day_offset=2, budget=100),
            TemplateSectionSpec(title="Taj Mahal & Agra Fort", type=SectionType.activity, day_offset=3, budget=75),
            TemplateSectionSpec(title="Travel to Jaipur", type=SectionType.travel, day_offset=4, budget=110),
            TemplateSectionSpec(title="Jaipur palaces & bazaars", type=SectionType.activity, day_offset=5, budget=95),
            TemplateSectionSpec(title="Departure from Jaipur", type=SectionType.travel, day_offset=6, budget=80),
        ],
    ),
    TripTemplateDef(
        id="europe-highlights",
        name="Europe 10-Day Highlights",
        description="Paris, Rome, and Barcelona — art, food, and architecture.",
        duration_days=10,
        city_names=["Paris", "Rome", "Barcelona"],
        sections=[
            TemplateSectionSpec(title="Paris arrival", type=SectionType.travel, day_offset=0, budget=200),
            TemplateSectionSpec(title="Louvre & Seine", type=SectionType.activity, day_offset=1, budget=120),
            TemplateSectionSpec(title="Eiffel & Montmartre", type=SectionType.activity, day_offset=2, budget=100),
            TemplateSectionSpec(title="Fly to Rome", type=SectionType.travel, day_offset=3, budget=180),
            TemplateSectionSpec(title="Colosseum & Forum", type=SectionType.activity, day_offset=4, budget=90),
            TemplateSectionSpec(title="Vatican City", type=SectionType.activity, day_offset=5, budget=110),
            TemplateSectionSpec(title="Fly to Barcelona", type=SectionType.travel, day_offset=6, budget=160),
            TemplateSectionSpec(title="Gothic Quarter & Gaudí", type=SectionType.activity, day_offset=7, budget=85),
            TemplateSectionSpec(title="Beach & tapas", type=SectionType.activity, day_offset=8, budget=75),
            TemplateSectionSpec(title="Departure", type=SectionType.travel, day_offset=9, budget=90),
        ],
    ),
    TripTemplateDef(
        id="kerala-backwaters",
        name="Kerala Backwaters",
        description="5-day Kochi, Alleppey houseboat, and Munnar hills.",
        duration_days=5,
        city_names=["Kochi", "Alleppey", "Munnar"],
        sections=[
            TemplateSectionSpec(title="Kochi arrival", type=SectionType.travel, day_offset=0, budget=100),
            TemplateSectionSpec(title="Fort Kochi & spices", type=SectionType.activity, day_offset=1, budget=70),
            TemplateSectionSpec(title="Alleppey houseboat", type=SectionType.stay, day_offset=2, budget=180),
            TemplateSectionSpec(title="Munnar tea estates", type=SectionType.activity, day_offset=3, budget=90),
            TemplateSectionSpec(title="Return & departure", type=SectionType.travel, day_offset=4, budget=85),
        ],
    ),
]


def list_templates() -> list[TemplatePublic]:
    return [
        TemplatePublic(
            id=t.id,
            name=t.name,
            description=t.description,
            duration_days=t.duration_days,
            city_names=t.city_names,
            stop_count=len(t.city_names),
            section_count=len(t.sections),
        )
        for t in TEMPLATES
    ]


def get_template(template_id: str) -> TripTemplateDef:
    for t in TEMPLATES:
        if t.id == template_id:
            return t
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")


def _resolve_cities(db: Session, names: list[str]) -> list[City]:
    cities: list[City] = []
    for name in names:
        city = db.query(City).filter(City.name == name).first()
        if city is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"City not found in catalog: {name}",
            )
        cities.append(city)
    return cities


def _stop_for_day(stops: list[Stop], day_offset: int, total_days: int) -> Stop:
    if len(stops) == 1:
        return stops[0]
    idx = min(int(day_offset / max(total_days / len(stops), 1)), len(stops) - 1)
    return stops[idx]


def instantiate_template(db: Session, user: User, template_id: str, payload: TemplateInstantiate) -> Trip:
    tmpl = get_template(template_id)
    cities = _resolve_cities(db, tmpl.city_names)
    start = payload.start_date
    end = start + timedelta(days=tmpl.duration_days - 1)

    trip = Trip(
        user_id=user.id,
        name=payload.name or tmpl.name,
        start_date=start,
        end_date=end,
        description=payload.description or tmpl.description,
        cover_photo_url=cities[0].image_url,
        status=derive_trip_status(start, end),
        is_public=False,
    )
    db.add(trip)
    db.flush()

    segments = split_trip_dates_for_stops(start, end, len(cities))
    stops: list[Stop] = []
    for i, city in enumerate(cities):
        seg = segments[i]
        stop = Stop(
            trip_id=trip.id,
            city_id=city.id,
            order_index=i + 1,
            arrival_date=seg["arrival_date"],
            departure_date=seg["departure_date"],
        )
        db.add(stop)
        db.flush()
        stops.append(stop)

    for i, spec in enumerate(tmpl.sections):
        section_date = start + timedelta(days=min(spec.day_offset, tmpl.duration_days - 1))
        stop = _stop_for_day(stops, spec.day_offset, tmpl.duration_days)
        section = TripSection(
            stop_id=stop.id,
            title=spec.title,
            type=spec.type,
            date_range_start=section_date,
            date_range_end=section_date,
            budget=spec.budget,
            notes=spec.notes,
            order_index=i + 1,
        )
        db.add(section)
        db.flush()
        _upsert_section_expense(db, trip.id, section, spec.type, spec.budget)

    db.commit()
    db.refresh(trip)
    return trip
