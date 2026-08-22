from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import search as search_crud
from app.schemas.views import CityPublic

router = APIRouter()


@router.get("", response_model=list[CityPublic])
def list_cities(
    q: str | None = Query(default=None),
    country: str | None = Query(default=None),
    sort: str | None = Query(default="popularity"),
    limit: int | None = Query(default=None, ge=1, le=100),
    db: Session = Depends(get_db),
) -> list[CityPublic]:
    cities = search_crud.list_cities(db, q=q, country=country, sort=sort, limit=limit)
    return [CityPublic.model_validate(city) for city in cities]
