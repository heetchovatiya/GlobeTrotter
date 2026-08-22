from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models import User, UserRole
from app.schemas.auth import RegisterRequest, UserUpdate


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def create_user(db: Session, data: RegisterRequest) -> User:
    user = User(
        name=data.name,
        email=str(data.email).lower(),
        password_hash=hash_password(data.password),
        phone_number=data.phone_number,
        city=data.city,
        country=data.country,
        language_pref=data.language_pref,
        role=UserRole.user,
        is_suspended=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email.lower())
    if user is None:
        return None
    if user.is_suspended:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session) -> list[User]:
    return db.query(User).order_by(User.created_at.desc()).all()


def set_user_suspended(db: Session, user: User, suspended: bool) -> User:
    user.is_suspended = suspended
    db.commit()
    db.refresh(user)
    return user


def delete_user(db: Session, user: User) -> None:
    db.delete(user)
    db.commit()
