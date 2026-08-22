from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import sharing as sharing_crud
from app.models import User
from app.schemas.views import CopyTripResponse, ItineraryResponse, ShareResponse

router = APIRouter()


@router.post("/trips/{trip_id}/share", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
def share_trip(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShareResponse:
    return sharing_crud.share_trip(db, trip_id, current_user)


@router.get("/public/{slug}", response_model=ItineraryResponse)
def get_public_trip(slug: str, db: Session = Depends(get_db)) -> ItineraryResponse:
    return sharing_crud.get_shared_itinerary(db, slug)


@router.post("/public/{slug}/copy", response_model=CopyTripResponse, status_code=status.HTTP_201_CREATED)
def copy_public_trip(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CopyTripResponse:
    return sharing_crud.copy_shared_trip(db, slug, current_user)
