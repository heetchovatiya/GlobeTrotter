from datetime import datetime

from pydantic import BaseModel, Field

from app.schemas.templates import TemplateSectionSpec


class CommunityPostAdminPublic(BaseModel):
    id: int
    user_id: int
    trip_id: int | None = None
    content: str
    image_url: str | None = None
    created_at: datetime
    comment_count: int = 0
    is_hidden: bool = False
    author_name: str = ""
    author_email: str = ""
    trip: dict | None = None


class ModeratePostRequest(BaseModel):
    is_hidden: bool


class TripTemplateAdminCreate(BaseModel):
    id: str | None = Field(default=None, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    description: str = ""
    duration_days: int = Field(ge=1)
    city_names: list[str] = Field(min_length=1)
    sections: list[TemplateSectionSpec] = Field(default_factory=list)


class TripTemplateAdminUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    duration_days: int | None = Field(default=None, ge=1)
    city_names: list[str] | None = None
    sections: list[TemplateSectionSpec] | None = None
    is_active: bool | None = None


class TripTemplateAdminPublic(BaseModel):
    id: str
    name: str
    description: str
    duration_days: int
    city_names: list[str]
    sections: list[TemplateSectionSpec]
    source_trip_id: int | None = None
    source_post_id: int | None = None
    is_active: bool = True
    created_at: datetime


class TemplateFromTripRequest(BaseModel):
    template_id: str | None = Field(default=None, max_length=64)
    name: str | None = Field(default=None, max_length=255)
