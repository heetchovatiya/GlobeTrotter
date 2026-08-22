"""Distribute section and activity costs across calendar days."""

from __future__ import annotations

from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from app.models import BudgetAllocation, SectionType, Stop, Trip, TripSection


def _parse_allocation(raw: str | None) -> BudgetAllocation:
    if not raw:
        return BudgetAllocation.spread_dates
    try:
        return BudgetAllocation(raw)
    except ValueError:
        return BudgetAllocation.spread_dates


def enumerate_dates(start: date, end: date) -> list[date]:
    if end < start:
        return [start]
    days: list[date] = []
    cursor = start
    while cursor <= end:
        days.append(cursor)
        cursor += timedelta(days=1)
    return days


def _date_span(start: date | None, end: date | None, fallback: date) -> tuple[date, date]:
    s = start or fallback
    e = end or s
    if e < s:
        e = s
    return s, e


def section_effective_total(
    section: TripSection,
    stop: Stop | None,
    trip: Trip,
) -> float:
    budget = float(section.budget or 0)
    allocation = _parse_allocation(section.budget_allocation)

    if allocation == BudgetAllocation.per_day:
        start, end = _date_span(section.date_range_start, section.date_range_end, trip.start_date)
        day_count = len(enumerate_dates(start, end))
        return budget * day_count

    return budget


def _allocation_dates(
    section: TripSection,
    stop: Stop | None,
    trip: Trip,
) -> list[date]:
    allocation = _parse_allocation(section.budget_allocation)

    if allocation == BudgetAllocation.trip_total:
        return enumerate_dates(trip.start_date, trip.end_date)
    if allocation == BudgetAllocation.city_total and stop:
        start, end = _date_span(stop.arrival_date, stop.departure_date, trip.start_date)
        return enumerate_dates(start, end)
    if allocation == BudgetAllocation.lump_sum:
        day = section.date_range_start or trip.start_date
        return [day]

    start, end = _date_span(section.date_range_start, section.date_range_end, trip.start_date)
    return enumerate_dates(start, end)


def distribute_section_budget(
    section: TripSection,
    stop: Stop | None,
    trip: Trip,
) -> dict[date, Decimal]:
    total = Decimal(str(section_effective_total(section, stop, trip)))
    if total <= 0:
        return {}

    days = _allocation_dates(section, stop, trip)
    if not days:
        return {}

    per_day = total / len(days)
    result: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for day in days:
        result[day] += per_day
    return dict(result)


def activity_line_cost(activity_row) -> Decimal:
    override = activity_row.cost_override
    if override is not None:
        return Decimal(str(override))
    if activity_row.activity and activity_row.activity.cost is not None:
        return Decimal(str(activity_row.activity.cost))
    return Decimal("0")


def distribute_activity_cost(activity_row, fallback_day: date) -> dict[date, Decimal]:
    amount = activity_line_cost(activity_row)
    if amount <= 0:
        return {}
    day = activity_row.scheduled_date or fallback_day
    return {day: amount}


def summarize_itinerary_costs(trip: Trip) -> dict[str, float]:
    stay = Decimal("0")
    transport = Decimal("0")
    activities = Decimal("0")

    for stop in sorted(trip.stops, key=lambda s: s.order_index):
        for section in stop.sections:
            total = Decimal(str(section_effective_total(section, stop, trip)))
            if section.type == SectionType.stay:
                stay += total
            elif section.type == SectionType.travel:
                transport += total
            elif section.type == SectionType.activity:
                activities += total
            for act in section.trip_activities:
                activities += activity_line_cost(act)

    return {
        "itinerary_stay": float(stay),
        "itinerary_transport": float(transport),
        "itinerary_activities": float(activities),
        "itinerary_total": float(stay + transport + activities),
    }


def build_estimated_by_day(trip: Trip) -> dict[date, Decimal]:
    estimated: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))

    for stop in trip.stops:
        for section in stop.sections:
            for day, amount in distribute_section_budget(section, stop, trip).items():
                estimated[day] += amount
            fallback = section.date_range_start or stop.arrival_date or trip.start_date
            for act in section.trip_activities:
                for day, amount in distribute_activity_cost(act, fallback).items():
                    estimated[day] += amount

    return dict(estimated)
