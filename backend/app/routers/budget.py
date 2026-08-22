from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import budget as budget_crud
from app.models import User
from app.schemas.views import BudgetResponse

router = APIRouter()


@router.get("/trips/{trip_id}/budget", response_model=BudgetResponse)
def get_budget(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BudgetResponse:
    return budget_crud.get_budget_for_owned_trip(db, trip_id, current_user)
