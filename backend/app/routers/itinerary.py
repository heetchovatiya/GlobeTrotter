from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import itinerary as itinerary_crud
from app.crud import route as route_crud
from app.models import User
from app.schemas.route import TripRouteResponse
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


@router.get("/trips/{trip_id}/route", response_model=TripRouteResponse)
def get_trip_route(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TripRouteResponse:
    return route_crud.get_trip_route(db, trip_id, current_user)
