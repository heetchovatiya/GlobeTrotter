from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import itinerary as itinerary_crud
from app.models import User
from app.schemas.views import ItineraryResponse

router = APIRouter()


@router.get("/trips/{trip_id}/itinerary", response_model=ItineraryResponse)
def get_itinerary(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ItineraryResponse:
    trip = itinerary_crud.get_owned_trip_tree(db, trip_id, current_user)
    return itinerary_crud.build_itinerary_response(trip)
