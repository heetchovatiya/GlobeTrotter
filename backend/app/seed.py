"""Seed cities, activities, and a demo admin user.

Data source: seed_destinations.json (INR costs, Wikimedia images, per-city places).

Run from backend/:
  python -m app.seed              # skip if cities already exist
  python -m app.seed --force        # refresh city fields + replace activities
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models import Activity, ActivityType, City, User, UserRole
from app.services.city_images import fetch_city_image_url, normalize_image_url

SEED_FILE = Path(__file__).parent / "seed_destinations.json"

# Activity costs in the JSON are INR; DB stores USD-equivalent for the currency layer.
INR_PER_USD = 83.0

ACTIVITY_TYPE_MAP: dict[str, ActivityType] = {
    "sightseeing": ActivityType.sightseeing,
    "historical": ActivityType.culture,
    "food tour": ActivityType.food,
    "adventure": ActivityType.adventure,
    "culture": ActivityType.culture,
    "food": ActivityType.food,
    "nightlife": ActivityType.nightlife,
}


def _load_destinations() -> list[dict]:
    with open(SEED_FILE, encoding="utf-8") as f:
        return json.load(f)["cities"]


def _map_activity_type(raw: str) -> ActivityType:
    key = (raw or "").strip().lower()
    return ACTIVITY_TYPE_MAP.get(key, ActivityType.sightseeing)


def _inr_to_usd(amount_inr: float) -> float:
    if amount_inr <= 0:
        return 0.0
    return round(amount_inr / INR_PER_USD, 2)


def _city_image_url(row: dict, cache: dict[str, str | None]) -> str | None:
    url = (row.get("image") or "").strip()
    if url:
        return normalize_image_url(
            url,
            city=row["name"],
            country=row["country"],
            cache=cache,
        )
    fetched = fetch_city_image_url(row["name"], row["country"])
    return fetched[:512] if fetched else None


def _place_image_url(
    place: dict,
    city_name: str,
    country: str,
    city_image: str | None,
    cache: dict[str, str | None],
) -> str | None:
    url = (place.get("image") or "").strip()
    if url:
        return normalize_image_url(
            url,
            city=city_name,
            country=country,
            fallback_url=city_image,
            cache=cache,
        )
    return city_image


def _popularity_from_cost(cost_index: float) -> int:
    return min(99, max(55, 60 + int(cost_index) // 3))


def seed(db: Session, *, force: bool = False) -> None:
    rows = _load_destinations()
    existing_count = db.query(City).count()

    if existing_count > 0 and not force:
        print("Seed skipped: cities already present. Run with --force to refresh activities.")
        return

    cities_touched = 0
    activities_created = 0
    wiki_cache: dict[str, str | None] = {}

    for row in rows:
        cost_index = float(row["cost_index"])
        image_url = _city_image_url(row, wiki_cache)

        city = (
            db.query(City)
            .filter(City.name == row["name"], City.country == row["country"])
            .first()
        )
        if city is None:
            city = City(
                name=row["name"],
                country=row["country"],
                cost_index=cost_index,
                popularity_score=_popularity_from_cost(cost_index),
                image_url=image_url,
            )
            db.add(city)
        else:
            city.cost_index = cost_index
            city.popularity_score = _popularity_from_cost(cost_index)
            if image_url:
                city.image_url = image_url

        db.flush()
        cities_touched += 1

        if force:
            db.query(Activity).filter(Activity.city_id == city.id).delete()

        existing_activities = db.query(Activity).filter(Activity.city_id == city.id).count()
        if existing_activities > 0 and not force:
            continue

        for place in row.get("places") or []:
            db.add(
                Activity(
                    city_id=city.id,
                    name=place["name"],
                    type=_map_activity_type(place.get("Activity type", "")),
                    cost=_inr_to_usd(float(place.get("estimated_cost") or 0)),
                    duration_mins=int(place.get("duration_minutes") or 60),
                    description=f"{place['name']} in {city.name}, {city.country}.",
                    image_url=_place_image_url(
                        place,
                        city.name,
                        city.country,
                        city.image_url,
                        wiki_cache,
                    ),
                )
            )
            activities_created += 1

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
    print(
        f"Seeded {cities_touched} cities and {activities_created} activities "
        f"from {SEED_FILE.name}."
    )
    print("Admin user: admin@example.com / ChangeMeAdmin1!")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed GlobeTrotter cities and activities")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Update existing cities and replace per-city activities from seed file",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed(db, force=args.force)
    finally:
        db.close()


if __name__ == "__main__":
    main()
