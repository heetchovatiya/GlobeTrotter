from sqlalchemy import func, or_
from sqlalchemy.orm import Session, selectinload

from app.crud.community import _post_query, _to_public
from app.models import CommunityPost, User
from app.schemas.community import CommunityPostPublic


def list_posts_admin(
    db: Session,
    *,
    q: str | None = None,
    include_hidden: bool = True,
    limit: int = 200,
) -> list[dict]:
    query = _post_query(db)
    if not include_hidden:
        query = query.filter(CommunityPost.is_hidden.is_(False))
    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(func.lower(CommunityPost.content).like(term))
    posts = query.order_by(CommunityPost.created_at.desc()).limit(limit).all()
    result: list[dict] = []
    for post in posts:
        public = _to_public(post, include_comments=False)
        user = db.query(User).filter(User.id == post.user_id).first()
        result.append(
            {
                **public.model_dump(),
                "is_hidden": post.is_hidden,
                "author_name": user.name if user else "Unknown",
                "author_email": user.email if user else "",
            }
        )
    return result


def set_post_hidden(db: Session, post_id: int, hidden: bool) -> CommunityPostPublic:
    post = _post_query(db).filter(CommunityPost.id == post_id).first()
    if post is None:
        raise ValueError("Post not found")
    post.is_hidden = hidden
    db.commit()
    post = _post_query(db).filter(CommunityPost.id == post_id).first()
    assert post is not None
    return _to_public(post, include_comments=False)


def delete_post(db: Session, post_id: int) -> None:
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if post is None:
        raise ValueError("Post not found")
    db.delete(post)
    db.commit()
