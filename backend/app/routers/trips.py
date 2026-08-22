from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import cloning as cloning_crud
from app.crud import templates as templates_crud
from app.crud import trips as trips_crud
from app.models import User
from app.schemas.templates import TemplateInstantiate, TemplatePublic
from app.schemas.trips import TripCreate, TripPublic, TripUpdate
from app.schemas.views import CopyTripResponse

router = APIRouter()


@router.get("/templates", response_model=list[TemplatePublic])
def list_trip_templates() -> list[TemplatePublic]:
    return templates_crud.list_templates()


@router.post(
    "/templates/{template_id}/instantiate",
    response_model=TripPublic,
    status_code=status.HTTP_201_CREATED,
)
def instantiate_trip_template(
    template_id: str,
    payload: TemplateInstantiate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripPublic:
    trip = templates_crud.instantiate_template(db, current_user, template_id, payload)
    trip.status = trips_crud.resolve_trip_status(trip)
    return TripPublic.model_validate(trip)


@router.post("", response_model=TripPublic, status_code=status.HTTP_201_CREATED)
def create_trip(
    payload: TripCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripPublic:
    trip = trips_crud.create_trip(db, current_user, payload)
    return TripPublic.model_validate(trip)


@router.get("", response_model=list[TripPublic])
def list_trips(
    status_filter: str | None = Query(default=None, alias="status"),
    sort: str | None = Query(default="start_date_desc"),
    limit: int | None = Query(default=None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TripPublic]:
    trips = trips_crud.list_trips_for_user(
        db,
        current_user,
        status_filter=status_filter,
        sort=sort,
        limit=limit,
    )
    return [TripPublic.model_validate(trip) for trip in trips]


@router.post("/{trip_id}/duplicate", response_model=CopyTripResponse, status_code=status.HTTP_201_CREATED)
def duplicate_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CopyTripResponse:
    trips_crud.get_owned_trip(db, trip_id, current_user)
    source = cloning_crud.load_trip_for_clone(db, trip_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    cloned = cloning_crud.clone_trip(db, source, current_user)
    return CopyTripResponse(trip_id=cloned.id)


@router.get("/{trip_id}", response_model=TripPublic)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripPublic:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    trip.status = trips_crud.resolve_trip_status(trip)
    return TripPublic.model_validate(trip)


@router.patch("/{trip_id}", response_model=TripPublic)
def update_trip(
    trip_id: int,
    payload: TripUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripPublic:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    trip = trips_crud.update_trip(db, trip, payload)
    return TripPublic.model_validate(trip)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    trips_crud.delete_trip(db, trip)
