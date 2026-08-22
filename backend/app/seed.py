"""Seed cities, activities, and a demo admin user.

Run from backend/: python -m app.seed
"""

import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Activity, ActivityType, City, User, UserRole

SEED_FILE = Path(__file__).parent / "seed_cities.json"


def _load_city_seeds() -> list[dict]:
    with open(SEED_FILE, encoding="utf-8") as f:
        rows = json.load(f)["cities"]
    return [
        {
            "name": row["name"],
            "country": row["country"],
            "cost_index": float(row["cost_index"]),
            "popularity_score": int(row["cost_index"]),
        }
        for row in rows
    ]


CITY_SEEDS: list[dict] = _load_city_seeds()


ACTIVITY_TEMPLATES: list[tuple[str, ActivityType, float, int, str]] = [
    ("City Walking Tour", ActivityType.sightseeing, 25.0, 180, "Guided walk through landmark districts."),
    ("Local Food Crawl", ActivityType.food, 40.0, 150, "Sample regional specialties across markets."),
    ("Adventure Day Trip", ActivityType.adventure, 90.0, 360, "Outdoor adventure with local operators."),
    ("Museum & Culture Pass", ActivityType.culture, 35.0, 240, "Major museums and heritage sites."),
    ("Nightlife Experience", ActivityType.nightlife, 55.0, 180, "Evening entertainment and live music."),
]


def seed(db: Session) -> None:
    if db.query(City).count() > 0:
        print("Seed skipped: cities already present.")
        return

    cities: list[City] = []
    for row in CITY_SEEDS:
        city = City(
            name=row["name"],
            country=row["country"],
            cost_index=row["cost_index"],
            popularity_score=row["popularity_score"],
            image_url=None,
        )
        db.add(city)
        cities.append(city)
    db.flush()

    for city in cities:
        for name, activity_type, cost, duration, description in ACTIVITY_TEMPLATES:
            db.add(
                Activity(
                    city_id=city.id,
                    name=f"{city.name} {name}",
                    type=activity_type,
                    cost=cost,
                    duration_mins=duration,
                    description=description,
                    image_url=None,
                )
            )

    if db.query(User).filter(User.email == "admin@example.com").first() is None:
        db.add(
            User(
                name="GlobeTrotter Admin",
                email="admin@example.com",
                password_hash=hash_password("ChangeMeAdmin1!"),
                role=UserRole.admin,
                city="Remote",
                country="N/A",
            )
        )

    db.commit()
    print(f"Seeded {len(cities)} cities and {len(cities) * len(ACTIVITY_TEMPLATES)} activities.")
    print("Admin user: admin@example.com / ChangeMeAdmin1!")


def main() -> None:
    db = SessionLocal()
    try:
        seed(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
