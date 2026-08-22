from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import trips as trips_crud
from app.models import User
from app.schemas.trips import TripCreate, TripPublic, TripUpdate

router = APIRouter()


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
    limit: int | None = Query(default=None, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TripPublic]:
    trips = trips_crud.list_trips_for_user(db, current_user, status_filter=status_filter, limit=limit)
    return [TripPublic.model_validate(trip) for trip in trips]


@router.get("/{trip_id}", response_model=TripPublic)
def get_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripPublic:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    trip.status = trips_crud.derive_trip_status(trip.start_date, trip.end_date)
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
