"""Backfill city and activity photos from location names.

Run from backend/: python -m app.refresh_city_images
Optional: python -m app.refresh_city_images --force
"""

import argparse

from app.core.database import SessionLocal
from app.services.city_images import (
    refresh_all_city_images,
    sync_activity_images_from_cities,
)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch realistic city images by location name")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Re-fetch images even when city.image_url is already set",
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        city_count = refresh_all_city_images(db, force=args.force)
        activity_count = sync_activity_images_from_cities(db)
        print(f"Updated {city_count} city images and {activity_count} activity images.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
