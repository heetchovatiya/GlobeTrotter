from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import expenses as expenses_crud
from app.models import User
from app.schemas.expenses import ExpenseCreate, ExpensePublic, ExpenseUpdate

router = APIRouter()


@router.get("/trips/{trip_id}/expenses", response_model=list[ExpensePublic])
def list_expenses(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ExpensePublic]:
    rows = expenses_crud.list_trip_expenses(db, trip_id, current_user)
    return [ExpensePublic.model_validate(r) for r in rows]


@router.post(
    "/trips/{trip_id}/expenses",
    response_model=ExpensePublic,
    status_code=status.HTTP_201_CREATED,
)
def create_expense(
    trip_id: int,
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpensePublic:
    row = expenses_crud.create_manual_expense(db, trip_id, current_user, payload)
    return ExpensePublic.model_validate(row)


@router.patch("/trips/{trip_id}/expenses/{expense_id}", response_model=ExpensePublic)
def update_expense(
    trip_id: int,
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ExpensePublic:
    row = expenses_crud.update_manual_expense(db, trip_id, expense_id, current_user, payload)
    return ExpensePublic.model_validate(row)


@router.delete("/trips/{trip_id}/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    trip_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    expenses_crud.delete_manual_expense(db, trip_id, expense_id, current_user)
