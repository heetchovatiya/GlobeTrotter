from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    users,
)

app = FastAPI(title="GlobeTrotter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
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


@app.get("/health")
def health():
    return {"status": "ok"}
