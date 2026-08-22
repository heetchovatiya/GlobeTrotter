"""Fetch realistic city photos by location name (Unsplash + Wikipedia + Wikimedia)."""

from __future__ import annotations

import logging
import re
import time
from urllib.parse import quote, unquote, urlparse

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Activity, City

logger = logging.getLogger(__name__)

WIKIMEDIA_API = "https://commons.wikimedia.org/w/api.php"
WIKIPEDIA_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary"
UNSPLASH_API = "https://api.unsplash.com/search/photos"
HTTP_HEADERS = {
    "User-Agent": "GlobeTrotter/1.0 (travel-app; https://github.com/heetchovatiya/GlobeTrotter)",
}

_WIKI_FILEPATH_RE = re.compile(
    r"(?:Special:FilePath/|Special:Redirect/file/|/wiki/File:)([^/?#]+)",
    re.IGNORECASE,
)


def _normalize_wiki_filename(name: str) -> str:
    return unquote(name).replace("_", " ").strip().lower()


def extract_wikimedia_filename(url: str) -> str | None:
    """Pull a Commons filename from a wiki/Special:FilePath URL."""
    if not url or "upload.wikimedia.org" in url:
        return None
    match = _WIKI_FILEPATH_RE.search(url)
    if match:
        return unquote(match.group(1))
    return None


def is_wiki_page_image_url(url: str | None) -> bool:
    if not url:
        return False
    return "commons.wikimedia.org" in url or "wikipedia.org/wiki/" in url


def resolve_wikimedia_file_urls(filenames: list[str]) -> dict[str, str | None]:
    """Batch-resolve Commons filenames to direct upload.wikimedia.org URLs."""
    unique = list(dict.fromkeys(name for name in filenames if name))
    resolved: dict[str, str | None] = {name: None for name in unique}
    if not unique:
        return resolved

    try:
        with httpx.Client(timeout=15.0, headers=HTTP_HEADERS) as client:
            for offset in range(0, len(unique), 50):
                chunk = unique[offset : offset + 50]
                lookup = {_normalize_wiki_filename(name): name for name in chunk}
                response = client.get(
                    WIKIMEDIA_API,
                    params={
                        "action": "query",
                        "titles": "|".join(f"File:{name}" for name in chunk),
                        "prop": "imageinfo",
                        "iiprop": "url",
                        "format": "json",
                    },
                )
                response.raise_for_status()
                pages = response.json().get("query", {}).get("pages", {})
                for page in pages.values():
                    if page.get("missing") is not None:
                        continue
                    title = (page.get("title") or "").removeprefix("File:")
                    original = lookup.get(_normalize_wiki_filename(title))
                    if not original:
                        continue
                    imageinfo = page.get("imageinfo") or []
                    if not imageinfo:
                        continue
                    direct = (imageinfo[0].get("url") or "").split("?")[0]
                    if direct.startswith("https://upload.wikimedia.org/"):
                        resolved[original] = direct
                time.sleep(0.1)
    except Exception as exc:
        logger.warning("Wikimedia file resolution failed: %s", exc)

    return resolved


def normalize_image_url(
    url: str | None,
    *,
    city: str | None = None,
    country: str | None = None,
    fallback_url: str | None = None,
    cache: dict[str, str | None] | None = None,
) -> str | None:
    """Convert wiki page URLs to direct image links; fall back when missing."""
    if not url:
        return fallback_url

    trimmed = url.strip()
    if trimmed.startswith("https://upload.wikimedia.org/") or "images.unsplash.com" in trimmed:
        return trimmed[:512]

    filename = extract_wikimedia_filename(trimmed)
    if filename:
        if cache is not None:
            if filename not in cache:
                cache[filename] = resolve_wikimedia_file_urls([filename]).get(filename)
            direct = cache[filename]
        else:
            direct = resolve_wikimedia_file_urls([filename]).get(filename)
        if direct:
            return direct[:512]

    if city and country:
        fetched = fetch_city_image_url(city, country)
        if fetched:
            return fetched[:512]

    return fallback_url[:512] if fallback_url else None


def _wiki_titles(city: str, country: str) -> list[str]:
    titles = [
        city.replace(" ", "_"),
        f"{city},_{country}".replace(" ", "_"),
    ]
    if country == "United States":
        titles.insert(1, f"{city},_{country.split()[0]}".replace(" ", "_"))
    if city == "New York":
        titles.insert(0, "New_York_City")
    if city == "Bora Bora":
        titles.insert(0, "Bora-Bora")
    seen: set[str] = set()
    ordered: list[str] = []
    for title in titles:
        if title not in seen:
            seen.add(title)
            ordered.append(title)
    return ordered


def fetch_from_unsplash(city: str, country: str) -> str | None:
    key = (settings.UNSPLASH_ACCESS_KEY or "").strip()
    if not key:
        return None
    try:
        with httpx.Client(timeout=12.0) as client:
            response = client.get(
                UNSPLASH_API,
                params={
                    "query": f"{city} {country} travel landmark",
                    "per_page": 1,
                    "orientation": "landscape",
                },
                headers={**HTTP_HEADERS, "Authorization": f"Client-ID {key}"},
            )
            response.raise_for_status()
            results = response.json().get("results") or []
            if not results:
                return None
            urls = results[0].get("urls") or {}
            return urls.get("regular") or urls.get("small")
    except Exception as exc:
        logger.warning("Unsplash fetch failed for %s, %s: %s", city, country, exc)
        return None


def fetch_from_wikipedia(city: str, country: str) -> str | None:
    try:
        with httpx.Client(timeout=12.0, headers=HTTP_HEADERS) as client:
            for title in _wiki_titles(city, country):
                response = client.get(f"{WIKIPEDIA_SUMMARY}/{quote(title)}")
                if response.status_code == 404:
                    continue
                response.raise_for_status()
                data = response.json()
                thumb = (data.get("thumbnail") or {}).get("source")
                if thumb:
                    return thumb
                original = (data.get("originalimage") or {}).get("source")
                if original:
                    return original
    except Exception as exc:
        logger.warning("Wikipedia fetch failed for %s, %s: %s", city, country, exc)
    return None


def fetch_from_wikimedia(city: str, country: str) -> str | None:
    try:
        with httpx.Client(timeout=12.0, headers=HTTP_HEADERS) as client:
            response = client.get(
                WIKIMEDIA_API,
                params={
                    "action": "query",
                    "generator": "search",
                    "gsrsearch": f"{city} {country} cityscape",
                    "gsrlimit": 5,
                    "prop": "pageimages",
                    "piprop": "thumbnail",
                    "pithumbsize": 800,
                    "format": "json",
                },
            )
            response.raise_for_status()
            pages = response.json().get("query", {}).get("pages", {})
            for page in pages.values():
                thumb = (page.get("thumbnail") or {}).get("source")
                if thumb:
                    return thumb
    except Exception as exc:
        logger.warning("Wikimedia fetch failed for %s, %s: %s", city, country, exc)
    return None


def fetch_city_image_url(city: str, country: str) -> str | None:
    """Resolve a landscape photo URL for a destination."""
    return (
        fetch_from_unsplash(city, country)
        or fetch_from_wikipedia(city, country)
        or fetch_from_wikimedia(city, country)
    )


def fetch_activity_image_url(city: str, country: str, activity_type: str) -> str | None:
    """Activity-specific search; falls back to city image."""
    return fetch_city_image_url(city, country)


def ensure_city_images(db: Session, cities: list[City], *, persist: bool = True) -> int:
    """Fill missing city.image_url values; returns count updated."""
    updated = 0
    for city in cities:
        if city.image_url:
            continue
        url = fetch_city_image_url(city.name, city.country)
        if url:
            city.image_url = url[:512]
            updated += 1
            if persist:
                time.sleep(0.15)
    if persist and updated:
        db.commit()
    return updated


def refresh_all_city_images(db: Session, *, force: bool = False) -> int:
    """Backfill or refresh images for every city in the database."""
    cities = db.query(City).order_by(City.id).all()
    updated = 0
    for city in cities:
        if city.image_url and not force:
            continue
        url = fetch_city_image_url(city.name, city.country)
        if url:
            city.image_url = url[:512]
            updated += 1
        time.sleep(0.2)
    db.commit()
    return updated


def sync_activity_images_from_cities(db: Session) -> int:
    """Copy city cover to activities that still have no image."""
    updated = 0
    activities = (
        db.query(Activity)
        .join(City, Activity.city_id == City.id)
        .filter(Activity.image_url.is_(None), City.image_url.isnot(None))
        .all()
    )
    city_cache: dict[int, str | None] = {}
    for activity in activities:
        if activity.city_id not in city_cache:
            city = db.query(City).filter(City.id == activity.city_id).first()
            city_cache[activity.city_id] = city.image_url if city else None
        city_url = city_cache.get(activity.city_id)
        if city_url:
            activity.image_url = city_url[:512]
            updated += 1
    if updated:
        db.commit()
    return updated


def fix_broken_image_urls(db: Session) -> tuple[int, int]:
    """Resolve wiki page URLs stored in the DB to direct image links."""
    cities = db.query(City).order_by(City.id).all()
    activities = (
        db.query(Activity)
        .join(City, Activity.city_id == City.id)
        .order_by(Activity.id)
        .all()
    )
    city_by_id = {city.id: city for city in cities}

    filenames: list[str] = []
    for city in cities:
        if name := extract_wikimedia_filename(city.image_url or ""):
            filenames.append(name)
    for activity in activities:
        if name := extract_wikimedia_filename(activity.image_url or ""):
            filenames.append(name)

    wiki_cache = resolve_wikimedia_file_urls(filenames)
    city_updates = 0
    activity_updates = 0

    for city in cities:
        if not is_wiki_page_image_url(city.image_url):
            continue
        filename = extract_wikimedia_filename(city.image_url or "")
        normalized = (wiki_cache.get(filename) if filename else None) or normalize_image_url(
            city.image_url,
            city=city.name,
            country=city.country,
            cache=wiki_cache,
        )
        if normalized and normalized != city.image_url:
            city.image_url = normalized[:512]
            city_updates += 1

    db.flush()

    for activity in activities:
        if not is_wiki_page_image_url(activity.image_url):
            continue
        city = city_by_id.get(activity.city_id)
        filename = extract_wikimedia_filename(activity.image_url or "")
        normalized = (
            (wiki_cache.get(filename) if filename else None)
            or (city.image_url if city else None)
        )
        if normalized and normalized != activity.image_url:
            activity.image_url = normalized[:512]
            activity_updates += 1

    if city_updates or activity_updates:
        db.commit()
    return city_updates, activity_updates
