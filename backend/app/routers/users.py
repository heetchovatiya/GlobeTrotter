from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import ledger as ledger_crud
from app.crud import users as users_crud
from app.models import User
from app.schemas.auth import UserPublic, UserUpdate
from app.schemas.ledger import TravelLedgerResponse

router = APIRouter()


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)) -> UserPublic:
    return UserPublic.model_validate(current_user)


@router.get("/me/travel-ledger", response_model=TravelLedgerResponse)
def get_travel_ledger(
    status: str | None = Query(default=None),
    start_from: date | None = Query(default=None),
    start_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TravelLedgerResponse:
    return ledger_crud.travel_ledger_for_user(
        db,
        current_user,
        status_filter=status,
        start_from=start_from,
        start_to=start_to,
    )


@router.patch("/me", response_model=UserPublic)
def patch_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserPublic:
    user = users_crud.update_user(db, current_user, payload)
    return UserPublic.model_validate(user)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    users_crud.delete_user(db, current_user)
