from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.crud import community as community_crud
from app.models import User
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityPostCreate,
    CommunityPostPublic,
    ShareItineraryRequest,
)

router = APIRouter()


@router.get("/posts", response_model=list[CommunityPostPublic])
def list_posts(
    sort: str = Query(default="recent"),
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CommunityPostPublic]:
    return community_crud.list_posts(db, sort=sort, limit=limit)


@router.post("/posts", response_model=CommunityPostPublic, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: CommunityPostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityPostPublic:
    return community_crud.create_post(db, current_user, payload)


@router.post(
    "/share-itinerary",
    response_model=CommunityPostPublic,
    status_code=status.HTTP_201_CREATED,
)
def share_itinerary(
    payload: ShareItineraryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityPostPublic:
    return community_crud.share_itinerary(db, current_user, payload)


@router.post(
    "/posts/{post_id}/comments",
    response_model=CommunityPostPublic,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    post_id: int,
    payload: CommunityCommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CommunityPostPublic:
    return community_crud.add_comment(db, current_user, post_id, payload)
