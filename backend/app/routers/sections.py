from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import trips as trips_crud
from app.models import User
from app.schemas.trips import SectionCreate, SectionPublic, SectionUpdate

router = APIRouter()


@router.post(
    "/trips/{trip_id}/stops/{stop_id}/sections",
    response_model=SectionPublic,
    status_code=status.HTTP_201_CREATED,
)
def create_section(
    trip_id: int,
    stop_id: int,
    payload: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionPublic:
    trip = trips_crud.get_owned_trip(db, trip_id, current_user)
    stop = trips_crud.get_owned_stop(db, trip, stop_id)
    section = trips_crud.create_section(db, trip, stop, payload)
    return SectionPublic.model_validate(section)


@router.patch("/sections/{section_id}", response_model=SectionPublic)
def update_section(
    section_id: int,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SectionPublic:
    trip, section = trips_crud.get_owned_section(db, section_id, current_user)
    section = trips_crud.update_section(db, trip, section, payload)
    return SectionPublic.model_validate(section)


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    _, section = trips_crud.get_owned_section(db, section_id, current_user)
    trips_crud.delete_section(db, section)
