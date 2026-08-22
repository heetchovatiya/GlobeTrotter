from pydantic import BaseModel, Field

from app.models import ActivityType


class CityAdminCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    country: str = Field(min_length=1, max_length=128)
    cost_index: float = Field(default=0, ge=0)
    popularity_score: int = Field(default=0, ge=0, le=100)
    image_url: str | None = Field(default=None, max_length=512)


class CityAdminUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    country: str | None = Field(default=None, min_length=1, max_length=128)
    cost_index: float | None = Field(default=None, ge=0)
    popularity_score: int | None = Field(default=None, ge=0, le=100)
    image_url: str | None = Field(default=None, max_length=512)


class ActivityAdminCreate(BaseModel):
    city_id: int = Field(ge=1)
    name: str = Field(min_length=1, max_length=255)
    type: ActivityType = ActivityType.sightseeing
    cost: float = Field(default=0, ge=0)
    duration_mins: int = Field(default=60, ge=1)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=512)


class ActivityAdminUpdate(BaseModel):
    city_id: int | None = Field(default=None, ge=1)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    type: ActivityType | None = None
    cost: float | None = Field(default=None, ge=0)
    duration_mins: int | None = Field(default=None, ge=1)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=512)


class BulkActivityItem(BaseModel):
    city_id: int | None = Field(default=None, ge=1)
    city_name: str | None = Field(default=None, max_length=255)
    country: str | None = Field(default=None, max_length=128)
    name: str = Field(min_length=1, max_length=255)
    type: ActivityType = ActivityType.sightseeing
    cost: float = Field(default=0, ge=0)
    duration_mins: int = Field(default=60, ge=1)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=512)


class BulkCityNestedActivity(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: ActivityType = ActivityType.sightseeing
    cost: float = Field(default=0, ge=0)
    duration_mins: int = Field(default=60, ge=1)
    description: str | None = None
    image_url: str | None = Field(default=None, max_length=512)


class BulkCityItem(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    country: str = Field(min_length=1, max_length=128)
    cost_index: float = Field(default=0, ge=0)
    popularity_score: int = Field(default=0, ge=0, le=100)
    image_url: str | None = Field(default=None, max_length=512)
    activities: list[BulkCityNestedActivity] = Field(default_factory=list)


class BulkCitiesUpload(BaseModel):
    cities: list[BulkCityItem] = Field(min_length=1)


class BulkActivitiesUpload(BaseModel):
    activities: list[BulkActivityItem] = Field(min_length=1)


class BulkUploadResult(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = Field(default_factory=list)
