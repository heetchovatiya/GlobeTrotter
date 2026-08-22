from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.crud.sharing import share_trip
from app.crud.trips import get_owned_trip
from app.models import CommunityComment, CommunityPost, Stop, Trip, User
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityCommentPublic,
    CommunityPostCreate,
    CommunityPostPublic,
    CommunityTripSummary,
    ShareItineraryRequest,
)


def _trip_budget_total(trip: Trip) -> float:
    total = 0.0
    for stop in trip.stops:
        for section in stop.sections:
            total += float(section.budget or 0)
    return total


def _trip_summary(trip: Trip | None) -> CommunityTripSummary | None:
    if trip is None:
        return None
    shared = trip.shared_trips[0] if trip.shared_trips else None
    return CommunityTripSummary(
        id=trip.id,
        name=trip.name,
        start_date=trip.start_date,
        end_date=trip.end_date,
        cover_photo_url=trip.cover_photo_url,
        status=trip.status,
        public_slug=shared.public_slug if shared else None,
        total_budget=_trip_budget_total(trip),
    )


def _post_query(db: Session):
    return db.query(CommunityPost).options(
        selectinload(CommunityPost.comments),
        selectinload(CommunityPost.trip)
        .selectinload(Trip.shared_trips),
        selectinload(CommunityPost.trip)
        .selectinload(Trip.stops)
        .selectinload(Stop.sections),
    )


def _to_public(post: CommunityPost, include_comments: bool = True) -> CommunityPostPublic:
    comments: list[CommunityCommentPublic] = []
    if include_comments:
        comments = [
            CommunityCommentPublic.model_validate(c)
            for c in sorted(post.comments, key=lambda c: c.created_at)
        ]
    return CommunityPostPublic(
        id=post.id,
        user_id=post.user_id,
        trip_id=post.trip_id,
        content=post.content,
        image_url=post.image_url,
        created_at=post.created_at,
        comment_count=len(post.comments),
        comments=comments,
        trip=_trip_summary(post.trip),
    )


def list_posts(db: Session, sort: str = "recent", limit: int = 50) -> list[CommunityPostPublic]:
    posts = _post_query(db).all()
    if sort == "popular":
        posts.sort(key=lambda p: (len(p.comments), p.created_at), reverse=True)
    else:
        posts.sort(key=lambda p: p.created_at, reverse=True)
    return [_to_public(p) for p in posts[:limit]]


def create_post(db: Session, user: User, data: CommunityPostCreate) -> CommunityPostPublic:
    if data.trip_id is not None:
        share_trip(db, data.trip_id, user)
    post = CommunityPost(
        user_id=user.id,
        trip_id=data.trip_id,
        content=data.content,
        image_url=data.image_url,
    )
    db.add(post)
    db.commit()
    post = _post_query(db).filter(CommunityPost.id == post.id).first()
    assert post is not None
    return _to_public(post)


def share_itinerary(
    db: Session, user: User, data: ShareItineraryRequest
) -> CommunityPostPublic:
    trip = get_owned_trip(db, data.trip_id, user)
    share_trip(db, data.trip_id, user)
    content = data.content.strip() if data.content else ""
    if not content:
        content = (
            f"Sharing my itinerary: {trip.name} "
            f"({trip.start_date.isoformat()} – {trip.end_date.isoformat()}). "
            f"Copy the link below to explore the full day-by-day plan!"
        )
    return create_post(
        db,
        user,
        CommunityPostCreate(
            content=content,
            trip_id=data.trip_id,
            image_url=data.image_url,
        ),
    )


def add_comment(
    db: Session, user: User, post_id: int, data: CommunityCommentCreate
) -> CommunityPostPublic:
    post = _post_query(db).filter(CommunityPost.id == post_id).first()
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    comment = CommunityComment(post_id=post.id, user_id=user.id, content=data.content)
    db.add(comment)
    db.commit()
    post = _post_query(db).filter(CommunityPost.id == post_id).first()
    assert post is not None
    return _to_public(post)
