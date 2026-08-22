from collections import defaultdict
from datetime import date
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.crud.itinerary import get_owned_trip_tree
from app.crud.trips import get_owned_trip
from app.models import Expense, User
from app.schemas.views import BudgetResponse, CategoryTotal, DayBudget


def get_budget_for_owned_trip(db: Session, trip_id: int, user: User) -> BudgetResponse:
    trip = get_owned_trip(db, trip_id, user)

    category_rows = (
        db.query(Expense.category, func.coalesce(func.sum(Expense.amount), 0))
        .filter(Expense.trip_id == trip.id)
        .group_by(Expense.category)
        .all()
    )
    by_category = [
        CategoryTotal(category=category, total=float(total))
        for category, total in category_rows
    ]

    trip_tree = get_owned_trip_tree(db, trip.id, user)
    estimated_by_day: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for stop in trip_tree.stops:
        for section in stop.sections:
            if section.budget is None:
                continue
            day = section.date_range_start or trip.start_date
            estimated_by_day[day] += Decimal(str(section.budget))

    expenses = (
        db.query(Expense)
        .options(selectinload(Expense.section))
        .filter(Expense.trip_id == trip.id)
        .all()
    )
    actual_by_day: dict[date, Decimal] = defaultdict(lambda: Decimal("0"))
    for expense in expenses:
        if expense.section and expense.section.date_range_start:
            day = expense.section.date_range_start
        else:
            day = trip.start_date
        actual_by_day[day] += Decimal(str(expense.amount))

    all_days = sorted(set(estimated_by_day) | set(actual_by_day))
    by_day: list[DayBudget] = []
    overbudget_days: list[date] = []
    for day in all_days:
        estimated = float(estimated_by_day.get(day, Decimal("0")))
        actual = float(actual_by_day.get(day, Decimal("0")))
        by_day.append(DayBudget(date=day, estimated=estimated, actual=actual))
        if actual > estimated:
            overbudget_days.append(day)

    return BudgetResponse(
        trip_id=trip.id,
        by_category=by_category,
        by_day=by_day,
        overbudget_days=overbudget_days,
    )
