from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token
from app.crud import users as users_crud
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserPublic

router = APIRouter()


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = users_crud.get_user_by_email(db, str(payload.email).lower())
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    user = users_crud.create_user(db, payload)
    token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value},
    )
    return AuthResponse(access_token=token, user=UserPublic.model_validate(user))


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = users_crud.authenticate_user(db, str(payload.email), payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role.value},
    )
    return AuthResponse(access_token=token, user=UserPublic.model_validate(user))
