from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.crud.trips import get_owned_trip
from app.models import CommunityComment, CommunityPost, Trip, User
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityCommentPublic,
    CommunityPostCreate,
    CommunityPostPublic,
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
    )


def list_posts(db: Session, sort: str = "recent", limit: int = 50) -> list[CommunityPostPublic]:
    posts = (
        db.query(CommunityPost)
        .options(selectinload(CommunityPost.comments))
        .all()
    )
    if sort == "popular":
        posts.sort(key=lambda p: (len(p.comments), p.created_at), reverse=True)
    else:
        posts.sort(key=lambda p: p.created_at, reverse=True)
    return [_to_public(p) for p in posts[:limit]]


def create_post(db: Session, user: User, data: CommunityPostCreate) -> CommunityPostPublic:
    if data.trip_id is not None:
        trip = get_owned_trip(db, data.trip_id, user)
        if not trip.is_public:
            # publishing a community post about a trip implies it is shareable
            trip.is_public = True
    post = CommunityPost(
        user_id=user.id,
        trip_id=data.trip_id,
        content=data.content,
        image_url=data.image_url,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post = (
        db.query(CommunityPost)
        .options(selectinload(CommunityPost.comments))
        .filter(CommunityPost.id == post.id)
        .first()
    )
    assert post is not None
    return _to_public(post)


def add_comment(
    db: Session, user: User, post_id: int, data: CommunityCommentCreate
) -> CommunityPostPublic:
    post = (
        db.query(CommunityPost)
        .options(selectinload(CommunityPost.comments))
        .filter(CommunityPost.id == post_id)
        .first()
    )
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    comment = CommunityComment(post_id=post.id, user_id=user.id, content=data.content)
    db.add(comment)
    db.commit()
    post = (
        db.query(CommunityPost)
        .options(selectinload(CommunityPost.comments))
        .filter(CommunityPost.id == post_id)
        .first()
    )
    assert post is not None
    return _to_public(post)
