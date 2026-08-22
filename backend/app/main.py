from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.core.config import settings
from app.routers import (
    activities,
    admin,
    auth,
    budget,
    cities,
    community,
    itinerary,
    sections,
    sharing,
    stops,
    trips,
    uploads,
    users,
)

app = FastAPI(title="GlobeTrotter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(trips.router, prefix="/trips", tags=["trips"])
app.include_router(stops.router, tags=["stops"])
app.include_router(sections.router, tags=["sections"])
app.include_router(cities.router, prefix="/cities", tags=["cities"])
app.include_router(activities.router, prefix="/activities", tags=["activities"])
app.include_router(itinerary.router, tags=["itinerary"])
app.include_router(budget.router, tags=["budget"])
app.include_router(sharing.router, tags=["sharing"])
app.include_router(community.router, prefix="/community", tags=["community"])
app.include_router(admin.router, prefix="/admin", tags=["admin"])
app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])

UPLOADS_ROOT = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_ROOT)), name="uploads")


@app.get("/health")
def health():
    return {"status": "ok"}
