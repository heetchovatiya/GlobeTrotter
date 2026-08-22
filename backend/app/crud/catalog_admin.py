from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import Activity, ActivityType, City
from app.schemas.catalog_admin import (
    ActivityAdminCreate,
    ActivityAdminUpdate,
    BulkActivitiesUpload,
    BulkCitiesUpload,
    BulkUploadResult,
    CityAdminCreate,
    CityAdminUpdate,
)


def list_cities_admin(
    db: Session,
    *,
    q: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[City], int]:
    query = db.query(City)
    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(
            or_(
                func.lower(City.name).like(term),
                func.lower(City.country).like(term),
            )
        )
    total = query.count()
    rows = query.order_by(City.name.asc()).offset(offset).limit(limit).all()
    return rows, total


def get_city(db: Session, city_id: int) -> City | None:
    return db.query(City).filter(City.id == city_id).first()


def create_city(db: Session, data: CityAdminCreate) -> City:
    city = City(
        name=data.name.strip(),
        country=data.country.strip(),
        cost_index=data.cost_index,
        popularity_score=data.popularity_score,
        image_url=data.image_url,
    )
    db.add(city)
    db.commit()
    db.refresh(city)
    return city


def update_city(db: Session, city: City, data: CityAdminUpdate) -> City:
    payload = data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        if isinstance(value, str):
            value = value.strip()
        setattr(city, key, value)
    db.commit()
    db.refresh(city)
    return city


def delete_city(db: Session, city: City) -> None:
    db.delete(city)
    db.commit()


def list_activities_admin(
    db: Session,
    *,
    q: str | None = None,
    city_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[Activity], int]:
    query = db.query(Activity)
    if city_id:
        query = query.filter(Activity.city_id == city_id)
    if q:
        term = f"%{q.strip().lower()}%"
        query = query.filter(func.lower(Activity.name).like(term))
    total = query.count()
    rows = query.order_by(Activity.name.asc()).offset(offset).limit(limit).all()
    return rows, total


def get_activity(db: Session, activity_id: int) -> Activity | None:
    return db.query(Activity).filter(Activity.id == activity_id).first()


def create_activity(db: Session, data: ActivityAdminCreate) -> Activity:
    city = get_city(db, data.city_id)
    if city is None:
        raise ValueError("City not found")
    activity = Activity(
        city_id=data.city_id,
        name=data.name.strip(),
        type=data.type,
        cost=data.cost,
        duration_mins=data.duration_mins,
        description=data.description,
        image_url=data.image_url,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity


def update_activity(db: Session, activity: Activity, data: ActivityAdminUpdate) -> Activity:
    payload = data.model_dump(exclude_unset=True)
    if "city_id" in payload:
        city = get_city(db, payload["city_id"])
        if city is None:
            raise ValueError("City not found")
    for key, value in payload.items():
        if key == "name" and isinstance(value, str):
            value = value.strip()
        setattr(activity, key, value)
    db.commit()
    db.refresh(activity)
    return activity


def delete_activity(db: Session, activity: Activity) -> None:
    db.delete(activity)
    db.commit()


def _find_city_by_name_country(db: Session, name: str, country: str) -> City | None:
    return (
        db.query(City)
        .filter(
            func.lower(City.name) == name.strip().lower(),
            func.lower(City.country) == country.strip().lower(),
        )
        .first()
    )


def bulk_upload_cities(db: Session, payload: BulkCitiesUpload) -> BulkUploadResult:
    result = BulkUploadResult()
    for idx, row in enumerate(payload.cities, start=1):
        try:
            existing = _find_city_by_name_country(db, row.name, row.country)
            if existing:
                existing.cost_index = row.cost_index
                existing.popularity_score = row.popularity_score
                if row.image_url:
                    existing.image_url = row.image_url
                city = existing
                result.updated += 1
            else:
                city = City(
                    name=row.name.strip(),
                    country=row.country.strip(),
                    cost_index=row.cost_index,
                    popularity_score=row.popularity_score,
                    image_url=row.image_url,
                )
                db.add(city)
                db.flush()
                result.created += 1

            for act in row.activities:
                dup = (
                    db.query(Activity)
                    .filter(
                        Activity.city_id == city.id,
                        func.lower(Activity.name) == act.name.strip().lower(),
                    )
                    .first()
                )
                if dup:
                    dup.type = act.type
                    dup.cost = act.cost
                    dup.duration_mins = act.duration_mins
                    dup.description = act.description
                    if act.image_url:
                        dup.image_url = act.image_url
                else:
                    db.add(
                        Activity(
                            city_id=city.id,
                            name=act.name.strip(),
                            type=act.type,
                            cost=act.cost,
                            duration_mins=act.duration_mins,
                            description=act.description,
                            image_url=act.image_url,
                        )
                    )
            db.commit()
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            result.errors.append(f"Row {idx} ({row.name}): {exc}")
            result.skipped += 1
    return result


def bulk_upload_activities(db: Session, payload: BulkActivitiesUpload) -> BulkUploadResult:
    result = BulkUploadResult()
    for idx, row in enumerate(payload.activities, start=1):
        try:
            city_id = row.city_id
            if city_id is None:
                if not row.city_name or not row.country:
                    raise ValueError("Provide city_id or city_name + country")
                city = _find_city_by_name_country(db, row.city_name, row.country)
                if city is None:
                    raise ValueError(f"City not found: {row.city_name}, {row.country}")
                city_id = city.id
            elif get_city(db, city_id) is None:
                raise ValueError(f"City id {city_id} not found")

            dup = (
                db.query(Activity)
                .filter(
                    Activity.city_id == city_id,
                    func.lower(Activity.name) == row.name.strip().lower(),
                )
                .first()
            )
            if dup:
                dup.type = row.type
                dup.cost = row.cost
                dup.duration_mins = row.duration_mins
                dup.description = row.description
                if row.image_url:
                    dup.image_url = row.image_url
                result.updated += 1
            else:
                db.add(
                    Activity(
                        city_id=city_id,
                        name=row.name.strip(),
                        type=row.type,
                        cost=row.cost,
                        duration_mins=row.duration_mins,
                        description=row.description,
                        image_url=row.image_url,
                    )
                )
                result.created += 1
            db.commit()
        except Exception as exc:  # noqa: BLE001
            db.rollback()
            result.errors.append(f"Row {idx} ({row.name}): {exc}")
            result.skipped += 1
    return result
