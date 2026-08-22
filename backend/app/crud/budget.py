from collections import defaultdict
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.crud.itinerary import get_owned_trip_tree, get_trip_tree_by_id
from app.crud.trips import get_owned_trip
from app.models import Expense, Trip, User
from app.schemas.views import BudgetResponse, CategoryTotal, DayBudget
from app.services.budget_allocation import build_estimated_by_day, summarize_itinerary_costs


def get_budget_for_owned_trip(db: Session, trip_id: int, user: User) -> BudgetResponse:
    trip = get_owned_trip(db, trip_id, user)
    return get_budget_for_trip(db, trip.id)


def get_budget_for_trip(db: Session, trip_id: int) -> BudgetResponse:
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    trip_tree = get_trip_tree_by_id(db, trip.id)
    estimated_by_day = build_estimated_by_day(trip_tree)
    itinerary = summarize_itinerary_costs(trip_tree)

    expenses = (
        db.query(Expense)
        .options(selectinload(Expense.section))
        .filter(Expense.trip_id == trip.id)
        .all()
    )
    manual_expenses = [expense for expense in expenses if expense.section_id is None]

    category_totals: dict = defaultdict(lambda: Decimal("0"))
    for expense in manual_expenses:
        category_totals[expense.category] += Decimal(str(expense.amount))
    by_category = [
        CategoryTotal(category=category, total=float(total))
        for category, total in category_totals.items()
    ]

    actual_by_day: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for expense in manual_expenses:
        day = expense.expense_date or trip.start_date
        actual_by_day[day] += Decimal(str(expense.amount))

    all_days = sorted(set(estimated_by_day) | set(actual_by_day))
    by_day: list[DayBudget] = []
    overbudget_days: list[date] = []
    for day in all_days:
        estimated = float(estimated_by_day.get(day, Decimal("0")))
        actual = float(actual_by_day.get(day, Decimal("0")))
        by_day.append(DayBudget(date=day, estimated=estimated, actual=actual))
        if actual > estimated and estimated > 0:
            overbudget_days.append(day)

    total_budget = itinerary["itinerary_total"]
    total_spent = float(sum(category_totals.values()))
    grand_total = total_budget + total_spent

    return BudgetResponse(
        trip_id=trip.id,
        by_category=by_category,
        by_day=by_day,
        overbudget_days=overbudget_days,
        itinerary_stay=itinerary["itinerary_stay"],
        itinerary_transport=itinerary["itinerary_transport"],
        itinerary_activities=itinerary["itinerary_activities"],
        itinerary_total=itinerary["itinerary_total"],
        general_spent=total_spent,
        grand_total=grand_total,
    )
