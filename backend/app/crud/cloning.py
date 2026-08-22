"""Deep-clone a trip (stops, sections, activities, expenses) for a user."""

from sqlalchemy.orm import Session, selectinload

from app.crud.trips import derive_trip_status
from app.models import Expense, Stop, Trip, TripActivity, TripSection, User


def clone_trip(
    db: Session,
    source: Trip,
    user: User,
    *,
    name: str | None = None,
) -> Trip:
    """Clone source trip into user account. Source must have relationships loaded."""
    cloned = Trip(
        user_id=user.id,
        name=name or f"Copy of {source.name}",
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
                note=expense.note,
                expense_date=expense.expense_date,
                receipt_url=expense.receipt_url,
            )
        )

    db.commit()
    db.refresh(cloned)
    return cloned


def load_trip_for_clone(db: Session, trip_id: int) -> Trip | None:
    return (
        db.query(Trip)
        .options(
            selectinload(Trip.stops).selectinload(Stop.sections).selectinload(TripSection.trip_activities),
            selectinload(Trip.expenses),
        )
        .filter(Trip.id == trip_id)
        .first()
    )
