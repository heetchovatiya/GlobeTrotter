from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models import TripStatus


class CommunityPostCreate(BaseModel):
    content: str = Field(min_length=1, max_length=5000)
    trip_id: int | None = None
    image_url: str | None = Field(default=None, max_length=512)


class ShareItineraryRequest(BaseModel):
    trip_id: int
    content: str | None = Field(default=None, max_length=5000)
    image_url: str | None = Field(default=None, max_length=512)


class CommunityCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class CommunityCommentPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    post_id: int
    user_id: int
    content: str
    created_at: datetime


class CommunityTripSummary(BaseModel):
    id: int
    name: str
    start_date: date
    end_date: date
    cover_photo_url: str | None = None
    status: TripStatus
    public_slug: str | None = None
    total_budget: float | None = None


class CommunityPostPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    trip_id: int | None = None
    content: str
    image_url: str | None = None
    created_at: datetime
    comment_count: int = 0
    comments: list[CommunityCommentPublic] = Field(default_factory=list)
    trip: CommunityTripSummary | None = None
