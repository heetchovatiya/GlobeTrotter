from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_role
from app.crud import admin as admin_crud
from app.crud import admin_community as community_admin_crud
from app.crud import catalog_admin as catalog_crud
from app.crud import template_admin as template_admin_crud
from app.crud import users as users_crud
from app.models import User, Trip, TripTemplate
from app.schemas.admin import (
    ActivityAnalyticsItem,
    AdminUserPublic,
    CityAnalyticsItem,
    SuspendRequest,
    TrendsResponse,
)
from app.schemas.admin_extended import (
    CommunityPostAdminPublic,
    ModeratePostRequest,
    TemplateFromTripRequest,
    TripTemplateAdminCreate,
    TripTemplateAdminPublic,
    TripTemplateAdminUpdate,
)
from app.schemas.templates import TemplateSectionSpec
from app.schemas.catalog_admin import (
    ActivityAdminCreate,
    ActivityAdminUpdate,
    BulkActivitiesUpload,
    BulkCitiesUpload,
    BulkUploadResult,
    CityAdminCreate,
    CityAdminUpdate,
)
from app.schemas.user_admin import AdminUserCreate, AdminUserUpdate
from app.schemas.views import ActivityPublic, CityPublic

router = APIRouter(dependencies=[Depends(require_role("admin"))])


def _user_public(db: Session, user: User) -> AdminUserPublic:
    trips_count = db.query(Trip).filter(Trip.user_id == user.id).count()
    return AdminUserPublic.model_validate(user).model_copy(update={"trips_count": trips_count})


def _template_public(row: TripTemplate) -> TripTemplateAdminPublic:
    sections = [TemplateSectionSpec.model_validate(s) for s in (row.sections or [])]
    return TripTemplateAdminPublic(
        id=row.id,
        name=row.name,
        description=row.description or "",
        duration_days=row.duration_days,
        city_names=list(row.city_names or []),
        sections=sections,
        source_trip_id=row.source_trip_id,
        source_post_id=row.source_post_id,
        is_active=row.is_active,
        created_at=row.created_at,
    )


@router.get("/users", response_model=list[AdminUserPublic])
def list_users(
    q: str | None = Query(default=None, max_length=128),
    db: Session = Depends(get_db),
) -> list[AdminUserPublic]:
    users = users_crud.list_users(db, q=q)
    return [_user_public(db, user) for user in users]


@router.post("/users", response_model=AdminUserPublic, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
) -> AdminUserPublic:
    try:
        user = users_crud.admin_create_user(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _user_public(db, user)


@router.patch("/users/{user_id}", response_model=AdminUserPublic)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
) -> AdminUserPublic:
    user = users_crud.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.role is not None and user.id == current_user.id and payload.role != user.role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )
    if payload.is_suspended is True and user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend yourself",
        )
    try:
        user = users_crud.admin_update_user(db, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _user_public(db, user)


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
    return _user_public(db, user)


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


# --- Cities ---


@router.get("/cities")
def list_cities(
    q: str | None = Query(default=None, max_length=128),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    rows, total = catalog_crud.list_cities_admin(db, q=q, limit=limit, offset=offset)
    return {
        "items": [CityPublic.model_validate(c) for c in rows],
        "total": total,
    }


@router.post("/cities", response_model=CityPublic, status_code=status.HTTP_201_CREATED)
def create_city(payload: CityAdminCreate, db: Session = Depends(get_db)) -> CityPublic:
    city = catalog_crud.create_city(db, payload)
    return CityPublic.model_validate(city)


@router.patch("/cities/{city_id}", response_model=CityPublic)
def update_city(
    city_id: int,
    payload: CityAdminUpdate,
    db: Session = Depends(get_db),
) -> CityPublic:
    city = catalog_crud.get_city(db, city_id)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    city = catalog_crud.update_city(db, city, payload)
    return CityPublic.model_validate(city)


@router.delete("/cities/{city_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_city(city_id: int, db: Session = Depends(get_db)) -> None:
    city = catalog_crud.get_city(db, city_id)
    if city is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found")
    catalog_crud.delete_city(db, city)


@router.post("/cities/bulk", response_model=BulkUploadResult)
def bulk_cities(payload: BulkCitiesUpload, db: Session = Depends(get_db)) -> BulkUploadResult:
    return catalog_crud.bulk_upload_cities(db, payload)


# --- Activities ---


@router.get("/activities")
def list_activities(
    q: str | None = Query(default=None, max_length=128),
    city_id: int | None = Query(default=None, ge=1),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> dict:
    rows, total = catalog_crud.list_activities_admin(
        db, q=q, city_id=city_id, limit=limit, offset=offset
    )
    return {
        "items": [ActivityPublic.model_validate(a) for a in rows],
        "total": total,
    }


@router.post("/activities", response_model=ActivityPublic, status_code=status.HTTP_201_CREATED)
def create_activity(payload: ActivityAdminCreate, db: Session = Depends(get_db)) -> ActivityPublic:
    try:
        activity = catalog_crud.create_activity(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ActivityPublic.model_validate(activity)


@router.patch("/activities/{activity_id}", response_model=ActivityPublic)
def update_activity(
    activity_id: int,
    payload: ActivityAdminUpdate,
    db: Session = Depends(get_db),
) -> ActivityPublic:
    activity = catalog_crud.get_activity(db, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    try:
        activity = catalog_crud.update_activity(db, activity, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return ActivityPublic.model_validate(activity)


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_activity(activity_id: int, db: Session = Depends(get_db)) -> None:
    activity = catalog_crud.get_activity(db, activity_id)
    if activity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Activity not found")
    catalog_crud.delete_activity(db, activity)


@router.post("/activities/bulk", response_model=BulkUploadResult)
def bulk_activities(payload: BulkActivitiesUpload, db: Session = Depends(get_db)) -> BulkUploadResult:
    return catalog_crud.bulk_upload_activities(db, payload)


# --- Analytics ---


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


# --- Community moderation ---


@router.get("/community/posts", response_model=list[CommunityPostAdminPublic])
def list_community_posts(
    q: str | None = Query(default=None, max_length=128),
    include_hidden: bool = Query(default=True),
    limit: int = Query(default=200, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CommunityPostAdminPublic]:
    rows = community_admin_crud.list_posts_admin(
        db, q=q, include_hidden=include_hidden, limit=limit
    )
    return [CommunityPostAdminPublic.model_validate(r) for r in rows]


@router.patch("/community/posts/{post_id}/moderate", response_model=CommunityPostAdminPublic)
def moderate_community_post(
    post_id: int,
    payload: ModeratePostRequest,
    db: Session = Depends(get_db),
) -> CommunityPostAdminPublic:
    try:
        community_admin_crud.set_post_hidden(db, post_id, payload.is_hidden)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    rows = community_admin_crud.list_posts_admin(db, include_hidden=True, limit=500)
    match = next((r for r in rows if r["id"] == post_id), None)
    if match is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return CommunityPostAdminPublic.model_validate(match)


@router.delete("/community/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community_post(post_id: int, db: Session = Depends(get_db)) -> None:
    try:
        community_admin_crud.delete_post(db, post_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


# --- Tour templates ---


@router.get("/templates", response_model=list[TripTemplateAdminPublic])
def list_trip_templates_admin(
    q: str | None = Query(default=None, max_length=128),
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[TripTemplateAdminPublic]:
    rows = template_admin_crud.list_templates(db, q=q, include_inactive=include_inactive)
    return [_template_public(r) for r in rows]


@router.post("/templates", response_model=TripTemplateAdminPublic, status_code=status.HTTP_201_CREATED)
def create_trip_template(
    payload: TripTemplateAdminCreate,
    db: Session = Depends(get_db),
) -> TripTemplateAdminPublic:
    try:
        row = template_admin_crud.create_template(
            db,
            template_id=payload.id,
            name=payload.name,
            description=payload.description,
            duration_days=payload.duration_days,
            city_names=payload.city_names,
            sections=[s.model_dump(mode="json") for s in payload.sections],
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _template_public(row)


@router.patch("/templates/{template_id}", response_model=TripTemplateAdminPublic)
def update_trip_template(
    template_id: str,
    payload: TripTemplateAdminUpdate,
    db: Session = Depends(get_db),
) -> TripTemplateAdminPublic:
    row = template_admin_crud.get_template_row(db, template_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    data = payload.model_dump(exclude_unset=True)
    if "sections" in data and data["sections"] is not None:
        data["sections"] = [s.model_dump(mode="json") for s in payload.sections or []]
    row = template_admin_crud.update_template(db, row, data)
    return _template_public(row)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_template(template_id: str, db: Session = Depends(get_db)) -> None:
    row = template_admin_crud.get_template_row(db, template_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    template_admin_crud.delete_template(db, row)


@router.post(
    "/templates/from-trip/{trip_id}",
    response_model=TripTemplateAdminPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_template_from_trip(
    trip_id: int,
    payload: TemplateFromTripRequest,
    db: Session = Depends(get_db),
) -> TripTemplateAdminPublic:
    try:
        row = template_admin_crud.template_from_trip(
            db,
            trip_id,
            template_id=payload.template_id,
            name=payload.name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _template_public(row)


@router.post(
    "/templates/from-post/{post_id}",
    response_model=TripTemplateAdminPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_template_from_post(
    post_id: int,
    payload: TemplateFromTripRequest,
    db: Session = Depends(get_db),
) -> TripTemplateAdminPublic:
    try:
        row = template_admin_crud.template_from_community_post(db, post_id, name=payload.name)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _template_public(row)
