from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.crud import admin as admin_crud
from app.crud import users as users_crud
from app.models import User
from app.schemas.admin import (
    ActivityAnalyticsItem,
    AdminUserPublic,
    CityAnalyticsItem,
    SuspendRequest,
    TrendsResponse,
)

router = APIRouter(dependencies=[Depends(require_role("admin"))])


@router.get("/users", response_model=list[AdminUserPublic])
def list_users(db: Session = Depends(get_db)) -> list[AdminUserPublic]:
    return [AdminUserPublic.model_validate(user) for user in users_crud.list_users(db)]


@router.post("/users/{user_id}/suspend", response_model=AdminUserPublic)
def suspend_user(
    user_id: int,
    payload: SuspendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> AdminUserPublic:
    user = users_crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend yourself",
        )
    user = users_crud.set_user_suspended(db, user, payload.suspended)
    return AdminUserPublic.model_validate(user)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> None:
    user = users_crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )
    users_crud.delete_user(db, user)


@router.get("/analytics/cities", response_model=list[CityAnalyticsItem])
def analytics_cities(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CityAnalyticsItem]:
    return admin_crud.analytics_cities(db, limit=limit)


@router.get("/analytics/activities", response_model=list[ActivityAnalyticsItem])
def analytics_activities(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[ActivityAnalyticsItem]:
    return admin_crud.analytics_activities(db, limit=limit)


@router.get("/analytics/trends", response_model=TrendsResponse)
def analytics_trends(db: Session = Depends(get_db)) -> TrendsResponse:
    return admin_crud.analytics_trends(db)
