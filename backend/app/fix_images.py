"""Resolve broken Wikimedia page URLs in the database to direct image links.

Run from backend/: python -m app.fix_images
"""

from app.core.database import SessionLocal
from app.services.city_images import fix_broken_image_urls


def main() -> None:
    db = SessionLocal()
    try:
        city_count, activity_count = fix_broken_image_urls(db)
        print(f"Fixed {city_count} city images and {activity_count} activity images.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
