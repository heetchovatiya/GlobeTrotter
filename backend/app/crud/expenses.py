from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud.trips import get_owned_trip
from app.models import Expense, User
from app.schemas.expenses import ExpenseCreate, ExpenseUpdate


def _expense_to_public(expense: Expense) -> dict:
    return {
        "id": expense.id,
        "trip_id": expense.trip_id,
        "category": expense.category,
        "amount": float(expense.amount),
        "section_id": expense.section_id,
        "note": expense.note,
        "expense_date": expense.expense_date,
        "receipt_url": expense.receipt_url,
        "is_manual": expense.section_id is None,
    }


def list_trip_expenses(db: Session, trip_id: int, user: User) -> list[dict]:
    get_owned_trip(db, trip_id, user)
    expenses = (
        db.query(Expense)
        .filter(Expense.trip_id == trip_id)
        .order_by(Expense.expense_date.desc().nullslast(), Expense.id.desc())
        .all()
    )
    return [_expense_to_public(e) for e in expenses]


def create_manual_expense(
    db: Session, trip_id: int, user: User, payload: ExpenseCreate
) -> dict:
    trip = get_owned_trip(db, trip_id, user)
    if payload.expense_date < trip.start_date or payload.expense_date > trip.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="expense_date must fall within the trip date range",
        )
    expense = Expense(
        trip_id=trip.id,
        category=payload.category,
        amount=payload.amount,
        section_id=None,
        note=payload.note,
        expense_date=payload.expense_date,
        receipt_url=payload.receipt_url,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return _expense_to_public(expense)


def _get_manual_expense(db: Session, trip_id: int, expense_id: int, user: User) -> Expense:
    get_owned_trip(db, trip_id, user)
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.trip_id == trip_id)
        .first()
    )
    if expense is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    if expense.section_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Section-linked expenses cannot be edited here",
        )
    return expense


def update_manual_expense(
    db: Session, trip_id: int, expense_id: int, user: User, payload: ExpenseUpdate
) -> dict:
    expense = _get_manual_expense(db, trip_id, expense_id, user)
    trip = get_owned_trip(db, trip_id, user)
    data = payload.model_dump(exclude_unset=True)
    if "expense_date" in data and data["expense_date"] is not None:
        d: date = data["expense_date"]
        if d < trip.start_date or d > trip.end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="expense_date must fall within the trip date range",
            )
    for key, value in data.items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return _expense_to_public(expense)


def delete_manual_expense(db: Session, trip_id: int, expense_id: int, user: User) -> None:
    expense = _get_manual_expense(db, trip_id, expense_id, user)
    db.delete(expense)
    db.commit()
