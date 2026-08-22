"""CSV export helpers for trip plans and budgets."""

from __future__ import annotations

import csv
import io
from datetime import date

from sqlalchemy.orm import Session

from app.crud.budget import get_budget_for_owned_trip
from app.crud.itinerary import build_itinerary_response, get_owned_trip_tree
from app.crud.ledger import travel_ledger_for_user
from app.crud.trips import get_owned_trip, list_trips_for_user
from app.models import Trip, User


def _csv_buffer() -> io.StringIO:
    return io.StringIO()


def budget_csv(db: Session, trip_id: int, user: User) -> str:
    budget = get_budget_for_owned_trip(db, trip_id, user)
    trip = get_owned_trip(db, trip_id, user)
    buf = _csv_buffer()
    writer = csv.writer(buf)
    writer.writerow(["GlobeTrotter Budget Export"])
    writer.writerow(["Trip", trip.name])
    writer.writerow(["Trip ID", trip.id])
    writer.writerow(["Start", trip.start_date.isoformat()])
    writer.writerow(["End", trip.end_date.isoformat()])
    writer.writerow([])
    writer.writerow(["Category", "Amount (USD base)"])
    for row in budget.by_category:
        writer.writerow([row.category.value, f"{row.total:.2f}"])
    writer.writerow([])
    writer.writerow(["Date", "Estimated", "Actual", "Variance"])
    for row in budget.by_day:
        variance = row.actual - row.estimated
        writer.writerow([row.date.isoformat(), f"{row.estimated:.2f}", f"{row.actual:.2f}", f"{variance:.2f}"])
    if budget.overbudget_days:
        writer.writerow([])
        writer.writerow(["Overbudget days", ", ".join(d.isoformat() for d in budget.overbudget_days)])
    return buf.getvalue()


def summary_csv(db: Session, trip_id: int, user: User) -> str:
    trip_tree = get_owned_trip_tree(db, trip_id, user)
    itinerary = build_itinerary_response(trip_tree)
    trip = trip_tree
    buf = _csv_buffer()
    writer = csv.writer(buf)
    writer.writerow(["GlobeTrotter Trip Plan Export"])
    writer.writerow(["Trip", trip.name])
    writer.writerow(["Trip ID", trip.id])
    writer.writerow(["Status", trip.status.value])
    writer.writerow(["Start", trip.start_date.isoformat()])
    writer.writerow(["End", trip.end_date.isoformat()])
    writer.writerow(["Description", trip.description or ""])
    writer.writerow([])
    writer.writerow(["Stops"])
    writer.writerow(["Order", "City ID", "Arrival", "Departure"])
    for stop in sorted(trip.stops, key=lambda s: s.order_index):
        writer.writerow([
            stop.order_index,
            stop.city_id,
            stop.arrival_date.isoformat() if stop.arrival_date else "",
            stop.departure_date.isoformat() if stop.departure_date else "",
        ])
    writer.writerow([])
    writer.writerow(["Day", "Date", "Section", "Type", "City", "Budget (USD base)", "Notes"])
    for day in itinerary.days:
        for section in day.sections:
            writer.writerow([
                day.date.isoformat(),
                day.date.isoformat(),
                section.title,
                section.type.value,
                section.city_name or "",
                f"{section.budget:.2f}" if section.budget is not None else "",
                (section.notes or "").replace("\n", " "),
            ])
    return buf.getvalue()


def all_trips_csv(db: Session, user: User) -> str:
    trips = list_trips_for_user(db, user, sort="start_date_desc")
    buf = _csv_buffer()
    writer = csv.writer(buf)
    writer.writerow(["GlobeTrotter — All Trips"])
    writer.writerow(["Exported", date.today().isoformat()])
    writer.writerow([])
    writer.writerow(["ID", "Name", "Status", "Start", "End", "Public"])
    for trip in trips:
        writer.writerow([
            trip.id,
            trip.name,
            trip.status.value,
            trip.start_date.isoformat(),
            trip.end_date.isoformat(),
            "yes" if trip.is_public else "no",
        ])
    return buf.getvalue()


def travel_ledger_csv(
    db: Session,
    user: User,
    *,
    status_filter: str | None = None,
    start_from: date | None = None,
    start_to: date | None = None,
) -> str:
    ledger = travel_ledger_for_user(
        db, user, status_filter=status_filter, start_from=start_from, start_to=start_to
    )
    buf = _csv_buffer()
    writer = csv.writer(buf)
    writer.writerow(["GlobeTrotter — Travel Ledger"])
    writer.writerow(["Exported", date.today().isoformat()])
    writer.writerow([])
    writer.writerow(["Trip ID", "Trip Name", "Status", "Start", "End", "Planned", "Spent", "Variance"])
    for row in ledger.rows:
        writer.writerow([
            row.trip_id,
            row.trip_name,
            row.status.value,
            row.start_date.isoformat(),
            row.end_date.isoformat(),
            f"{row.planned_budget:.2f}",
            f"{row.total_spent:.2f}",
            f"{row.variance:.2f}",
        ])
    writer.writerow([])
    writer.writerow([
        "TOTALS", "", "", "", "",
        f"{ledger.totals.total_planned:.2f}",
        f"{ledger.totals.total_spent:.2f}",
        f"{ledger.totals.total_variance:.2f}",
    ])
    return buf.getvalue()


def admin_all_trips_csv(db: Session) -> str:
    trips = db.query(Trip).order_by(Trip.created_at.desc()).all()
    buf = _csv_buffer()
    writer = csv.writer(buf)
    writer.writerow(["GlobeTrotter Admin — All Trips"])
    writer.writerow(["Exported", date.today().isoformat()])
    writer.writerow([])
    writer.writerow(["ID", "User ID", "Name", "Status", "Start", "End", "Public", "Created"])
    for trip in trips:
        writer.writerow([
            trip.id,
            trip.user_id,
            trip.name,
            trip.status.value if hasattr(trip.status, "value") else str(trip.status),
            trip.start_date.isoformat(),
            trip.end_date.isoformat(),
            "yes" if trip.is_public else "no",
            trip.created_at.isoformat() if trip.created_at else "",
        ])
    return buf.getvalue()


def admin_all_users_csv(db: Session) -> str:
    from app.models import User as UserModel

    users = db.query(UserModel).order_by(UserModel.created_at.desc()).all()
    buf = _csv_buffer()
    writer = csv.writer(buf)
    writer.writerow(["GlobeTrotter Admin — All Users"])
    writer.writerow(["Exported", date.today().isoformat()])
    writer.writerow([])
    writer.writerow(["ID", "Name", "Email", "Role", "City", "Country", "Suspended", "Created"])
    for user in users:
        writer.writerow([
            user.id,
            user.name,
            user.email,
            user.role.value if hasattr(user.role, "value") else str(user.role),
            user.city or "",
            user.country or "",
            "yes" if getattr(user, "is_suspended", False) else "no",
            user.created_at.isoformat() if user.created_at else "",
        ])
    return buf.getvalue()
