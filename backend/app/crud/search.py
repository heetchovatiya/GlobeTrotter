from sqlalchemy.orm import Session, joinedload

from app.models import Activity, ActivityType, City
from app.services.city_images import ensure_city_images


def list_cities(
    db: Session,
    *,
    q: str | None = None,
    country: str | None = None,
    sort: str | None = None,
    limit: int | None = None,
) -> list[City]:
    query = db.query(City)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(City.name.ilike(like))
    if country:
        query = query.filter(City.country.ilike(country.strip()))

    if sort == "popularity":
        query = query.order_by(City.popularity_score.desc(), City.name.asc())
    elif sort == "cost":
        query = query.order_by(City.cost_index.asc(), City.name.asc())
    elif sort == "name":
        query = query.order_by(City.name.asc())
    else:
        query = query.order_by(City.popularity_score.desc(), City.name.asc())

    if limit is not None:
        query = query.limit(limit)
    cities = query.all()
    ensure_city_images(db, cities)
    return cities


def list_activities(
    db: Session,
    *,
    q: str | None = None,
    city_id: int | None = None,
    type: ActivityType | None = None,
    max_cost: float | None = None,
    max_duration_mins: int | None = None,
    sort: str | None = None,
    limit: int | None = None,
) -> list[Activity]:
    query = db.query(Activity).options(joinedload(Activity.city))
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(Activity.name.ilike(like))
    if city_id is not None:
        query = query.filter(Activity.city_id == city_id)
    if type is not None:
        query = query.filter(Activity.type == type)
    if max_cost is not None:
        query = query.filter(Activity.cost <= max_cost)
    if max_duration_mins is not None:
        query = query.filter(Activity.duration_mins <= max_duration_mins)

    if sort == "cost":
        query = query.order_by(Activity.cost.asc(), Activity.name.asc())
    elif sort == "cost_asc":
        query = query.order_by(Activity.cost.asc(), Activity.name.asc())
    elif sort == "cost_desc":
        query = query.order_by(Activity.cost.desc(), Activity.name.asc())
    elif sort == "duration":
        query = query.order_by(Activity.duration_mins.asc(), Activity.name.asc())
    elif sort == "duration_desc":
        query = query.order_by(Activity.duration_mins.desc(), Activity.name.asc())
    elif sort == "popularity":
        query = query.order_by(Activity.name.asc())
    elif sort == "name":
        query = query.order_by(Activity.name.asc())
    else:
        query = query.order_by(Activity.name.asc())

    if limit is not None:
        query = query.limit(limit)
    activities = query.all()
    for activity in activities:
        if not activity.image_url and activity.city and activity.city.image_url:
            activity.image_url = activity.city.image_url
    return activities
