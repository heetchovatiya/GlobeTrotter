from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import trips as trips_crud
from app.models import User
from app.schemas.trips import StopCreate, StopPublic, StopUpdate

router = APIRouter()


@router.post(
    "/trips/{trip_id}/stops",
    response_model=StopPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_stop(
    trip_id: int,
    payload: StopCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StopPublic:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    stop = trips_crud.create_stop(db, trip, payload)
    return StopPublic.model_validate(stop)


@router.get("/trips/{trip_id}/stops", response_model=list[StopPublic])
def list_stops(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[StopPublic]:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    stops = sorted(trip.stops, key=lambda s: s.order_index)
    return [StopPublic.model_validate(stop) for stop in stops]


@router.patch("/trips/{trip_id}/stops/{stop_id}", response_model=StopPublic)
def update_stop(
    trip_id: int,
    stop_id: int,
    payload: StopUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> StopPublic:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    stop = trips_crud.get_owned_stop(db, trip, stop_id)
    stop = trips_crud.update_stop(db, stop, payload)
    return StopPublic.model_validate(stop)


@router.delete("/trips/{trip_id}/stops/{stop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_stop(
    trip_id: int,
    stop_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    stop = trips_crud.get_owned_stop(db, trip, stop_id)
    trips_crud.delete_stop(db, stop)
