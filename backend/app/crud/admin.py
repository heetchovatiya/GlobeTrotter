from datetime import date

from sqlalchemy import cast, Date, func
from sqlalchemy.orm import Session

from app.models import Activity, City, Stop, Trip, TripActivity, User
from app.schemas.admin import (
    ActivityAnalyticsItem,
    CityAnalyticsItem,
    TrendPoint,
    TrendsResponse,
)


def analytics_cities(db: Session, limit: int = 20) -> list[CityAnalyticsItem]:
    rows = (
        db.query(
            City.id,
            City.name,
            City.country,
            func.count(func.distinct(Stop.trip_id)).label("trip_count"),
        )
        .outerjoin(Stop, Stop.city_id == City.id)
        .group_by(City.id, City.name, City.country)
        .order_by(func.count(func.distinct(Stop.trip_id)).desc(), City.name.asc())
        .limit(limit)
        .all()
    )
    return [
        CityAnalyticsItem(
            city_id=row.id,
            name=row.name,
            country=row.country,
            trip_count=int(row.trip_count or 0),
        )
        for row in rows
    ]


def analytics_activities(db: Session, limit: int = 20) -> list[ActivityAnalyticsItem]:
    rows = (
        db.query(
            Activity.id,
            Activity.name,
            Activity.city_id,
            func.count(TripActivity.id).label("booking_count"),
        )
        .outerjoin(TripActivity, TripActivity.activity_id == Activity.id)
        .group_by(Activity.id, Activity.name, Activity.city_id)
        .order_by(func.count(TripActivity.id).desc(), Activity.name.asc())
        .limit(limit)
        .all()
    )
    return [
        ActivityAnalyticsItem(
            activity_id=row.id,
            name=row.name,
            city_id=row.city_id,
            booking_count=int(row.booking_count or 0),
        )
        for row in rows
    ]


def analytics_trends(db: Session) -> TrendsResponse:
    rows = (
        db.query(
            cast(Trip.created_at, Date).label("day"),
            func.count(Trip.id).label("trips_created"),
        )
        .group_by(cast(Trip.created_at, Date))
        .order_by(cast(Trip.created_at, Date).asc())
        .all()
    )
    trips_over_time = [
        TrendPoint(date=row.day if isinstance(row.day, date) else row.day, trips_created=int(row.trips_created))
        for row in rows
    ]
    active_users = db.query(func.count(func.distinct(Trip.user_id))).scalar() or 0
    total_trips = db.query(func.count(Trip.id)).scalar() or 0
    total_users = db.query(func.count(User.id)).scalar() or 0
    return TrendsResponse(
        trips_over_time=trips_over_time,
        active_users=int(active_users),
        total_trips=int(total_trips),
        total_users=int(total_users),
    )
