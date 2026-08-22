"""Re-align stops, sections, activities, and expenses when trip dates change."""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy.orm import Session, selectinload

from app.models import BudgetAllocation, Expense, SectionType, Stop, Trip, TripSection
from app.schemas.trips import SECTION_TYPE_TO_EXPENSE
from app.services.budget_allocation import section_effective_total


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


def _stay_day_count(arrival: date | None, departure: date | None) -> int:
    if not arrival or not departure or departure < arrival:
        return 1
    return (departure - arrival).days + 1


def _clamp_date(day: date, trip_start: date, trip_end: date) -> date:
    if day < trip_start:
        return trip_start
    if day > trip_end:
        return trip_end
    return day


def _shift_span_into_trip(
    start: date,
    end: date,
    trip_start: date,
    trip_end: date,
) -> tuple[date, date]:
    if end < start:
        end = start
    duration_days = (end - start).days

    if end < trip_start:
        start = trip_start
        end = min(trip_end, trip_start + timedelta(days=duration_days))
    else:
        start = _clamp_date(start, trip_start, trip_end)
        end = _clamp_date(end, trip_start, trip_end)
        if end < start:
            end = start
    return start, end


def normalize_stop_dates(stops: list[Stop], trip_start: date, trip_end: date) -> None:
    """Cascade stop dates within the trip window, preserving stay length where possible."""
    sorted_stops = sorted(stops, key=lambda s: s.order_index)
    for i, stop in enumerate(sorted_stops):
        nights = _stay_day_count(stop.arrival_date, stop.departure_date)

        if i == 0:
            if not stop.arrival_date or stop.arrival_date < trip_start:
                stop.arrival_date = trip_start
        else:
            prev_departure = sorted_stops[i - 1].departure_date or trip_start
            stop.arrival_date = prev_departure

        departure = stop.arrival_date + timedelta(days=nights - 1)
        if departure > trip_end:
            departure = trip_end
        if departure < stop.arrival_date:
            departure = stop.arrival_date
        stop.departure_date = departure


def sync_section_dates(section: TripSection, stop: Stop, trip: Trip) -> None:
    raw = section.budget_allocation or BudgetAllocation.spread_dates.value
    try:
        allocation = BudgetAllocation(raw)
    except ValueError:
        allocation = BudgetAllocation.spread_dates

    if allocation == BudgetAllocation.trip_total:
        section.date_range_start = trip.start_date
        section.date_range_end = trip.end_date
        return

    if allocation == BudgetAllocation.city_total:
        section.date_range_start = stop.arrival_date or trip.start_date
        section.date_range_end = (
            stop.departure_date or stop.arrival_date or trip.end_date
        )
        return

    if allocation == BudgetAllocation.lump_sum:
        day = section.date_range_start or trip.start_date
        day = _clamp_date(day, trip.start_date, trip.end_date)
        section.date_range_start = day
        section.date_range_end = day
        return

    start = section.date_range_start or trip.start_date
    end = section.date_range_end or start
    start, end = _shift_span_into_trip(start, end, trip.start_date, trip.end_date)
    section.date_range_start = start
    section.date_range_end = end


def sync_trip_after_date_change(db: Session, trip: Trip) -> None:
    """Normalize all trip-linked dates to fit the (possibly updated) trip window."""
    stops = sorted(trip.stops, key=lambda s: s.order_index)
    normalize_stop_dates(stops, trip.start_date, trip.end_date)

    for stop in stops:
        for section in stop.sections:
            sync_section_dates(section, stop, trip)
            effective = section_effective_total(section, stop, trip)
            _upsert_section_expense(db, trip.id, section, section.type, effective)

            for activity in section.trip_activities:
                if activity.scheduled_date is not None:
                    activity.scheduled_date = _clamp_date(
                        activity.scheduled_date, trip.start_date, trip.end_date
                    )

    manual_expenses = (
        db.query(Expense)
        .filter(Expense.trip_id == trip.id, Expense.section_id.is_(None))
        .all()
    )
    for expense in manual_expenses:
        if expense.expense_date is not None:
            expense.expense_date = _clamp_date(
                expense.expense_date, trip.start_date, trip.end_date
            )


def load_trip_for_date_sync(db: Session, trip_id: int) -> Trip | None:
    return (
        db.query(Trip)
        .options(
            selectinload(Trip.stops)
            .selectinload(Stop.sections)
            .selectinload(TripSection.trip_activities),
            selectinload(Trip.stops).selectinload(Stop.sections),
        )
        .filter(Trip.id == trip_id)
        .first()
    )
