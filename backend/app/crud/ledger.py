from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.itinerary import get_trip_tree_by_id
from app.crud.trips import list_trips_for_user, resolve_trip_status
from app.models import Expense, Trip, User
from app.schemas.ledger import LedgerRow, LedgerTotals, TravelLedgerResponse


def _planned_budget_for_trip(db: Session, trip: Trip) -> float:
    tree = get_trip_tree_by_id(db, trip.id)
    total = Decimal("0")
    for stop in tree.stops:
        for section in stop.sections:
            if section.budget is not None:
                total += Decimal(str(section.budget))
    return float(total)


def _spent_for_trip(db: Session, trip_id: int) -> float:
    total = (
        db.query(func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.trip_id == trip_id, Expense.section_id.is_(None))
        .scalar()
    )
    return float(total or 0)


def travel_ledger_for_user(
    db: Session,
    user: User,
    *,
    status_filter: str | None = None,
    start_from: date | None = None,
    start_to: date | None = None,
) -> TravelLedgerResponse:
    trips = list_trips_for_user(db, user, sort="start_date_desc")

    rows: list[LedgerRow] = []
    for trip in trips:
        status = resolve_trip_status(trip)
        if status_filter:
            effective = status_filter
            if effective == "upcoming" and status.value != "planning":
                continue
            if effective != "upcoming" and status.value != effective:
                continue
        if start_from and trip.start_date < start_from:
            continue
        if start_to and trip.start_date > start_to:
            continue

        planned = _planned_budget_for_trip(db, trip)
        spent = _spent_for_trip(db, trip.id)
        rows.append(
            LedgerRow(
                trip_id=trip.id,
                trip_name=trip.name,
                status=status,
                start_date=trip.start_date,
                end_date=trip.end_date,
                planned_budget=planned,
                total_spent=spent,
                variance=round(spent - planned, 2),
            )
        )

    totals = LedgerTotals(
        trip_count=len(rows),
        total_planned=round(sum(r.planned_budget for r in rows), 2),
        total_spent=round(sum(r.total_spent for r in rows), 2),
        total_variance=round(sum(r.variance for r in rows), 2),
    )

    return TravelLedgerResponse(
        rows=rows,
        totals=totals,
        filters_applied={
            "status": status_filter,
            "start_from": start_from.isoformat() if start_from else None,
            "start_to": start_to.isoformat() if start_to else None,
        },
    )
