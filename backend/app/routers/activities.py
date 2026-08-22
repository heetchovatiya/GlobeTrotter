from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import search as search_crud
from app.models import ActivityType
from app.schemas.views import ActivityPublic

router = APIRouter()


@router.get("", response_model=list[ActivityPublic])
def list_activities(
    q: str | None = Query(default=None),
    city_id: int | None = Query(default=None),
    type: ActivityType | None = Query(default=None),
    max_cost: float | None = Query(default=None, ge=0),
    sort: str | None = Query(default="name"),
    limit: int | None = Query(default=None, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[ActivityPublic]:
    activities = search_crud.list_activities(
        db,
        q=q,
        city_id=city_id,
        type=type,
        max_cost=max_cost,
        sort=sort,
        limit=limit,
    )
    return [ActivityPublic.model_validate(activity) for activity in activities]
