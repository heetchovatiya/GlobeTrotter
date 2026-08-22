import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.crud import budget as budget_crud
from app.crud.cloning import clone_trip, load_trip_for_clone
from app.crud.itinerary import build_itinerary_response, get_trip_tree_by_id
from app.crud.trips import get_owned_trip
from app.models import SharedTrip, User
from app.schemas.views import BudgetResponse, CopyTripResponse, ItineraryResponse, ShareResponse


def _unique_slug(db: Session) -> str:
    for _ in range(8):
        slug = secrets.token_urlsafe(6).replace("-", "").replace("_", "")[:10]
        exists = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
        if exists is None:
            return slug
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Could not generate share slug",
    )


def share_trip(db: Session, trip_id: int, user: User) -> ShareResponse:
    trip = get_owned_trip(db, trip_id, user)
    existing = db.query(SharedTrip).filter(SharedTrip.trip_id == trip.id).first()
    if existing is not None:
        return ShareResponse(trip_id=trip.id, public_slug=existing.public_slug)

    shared = SharedTrip(trip_id=trip.id, public_slug=_unique_slug(db))
    trip.is_public = True
    db.add(shared)
    db.commit()
    db.refresh(shared)
    return ShareResponse(trip_id=trip.id, public_slug=shared.public_slug)


def get_shared_itinerary(db: Session, slug: str) -> ItineraryResponse:
    shared = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
    if shared is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared trip not found")
    trip = get_trip_tree_by_id(db, shared.trip_id)
    return build_itinerary_response(trip)


def get_shared_budget(db: Session, slug: str) -> BudgetResponse:
    shared = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
    if shared is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared trip not found")
    return budget_crud.get_budget_for_trip(db, shared.trip_id)


def copy_shared_trip(db: Session, slug: str, user: User) -> CopyTripResponse:
    shared = db.query(SharedTrip).filter(SharedTrip.public_slug == slug).first()
    if shared is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared trip not found")

    source = load_trip_for_clone(db, shared.trip_id)
    if source is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")

    cloned = clone_trip(db, source, user)
    return CopyTripResponse(trip_id=cloned.id)
