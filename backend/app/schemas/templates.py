from datetime import date, timedelta

from pydantic import BaseModel, Field

from app.models import SectionType


class TemplateSectionSpec(BaseModel):
    title: str
    type: SectionType
    day_offset: int = Field(ge=0)
    budget: float = Field(ge=0)
    notes: str | None = None


class TemplatePublic(BaseModel):
    id: str
    name: str
    description: str
    duration_days: int
    city_names: list[str]
    stop_count: int
    section_count: int


class TemplateInstantiate(BaseModel):
    start_date: date
    name: str | None = Field(default=None, max_length=255)
    description: str | None = None
