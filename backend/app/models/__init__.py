import enum
from datetime import date, datetime, time

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class TripStatus(str, enum.Enum):
    draft = "draft"
    planning = "planning"
    ongoing = "ongoing"
    completed = "completed"


class ActivityType(str, enum.Enum):
    sightseeing = "sightseeing"
    food = "food"
    adventure = "adventure"
    culture = "culture"
    nightlife = "nightlife"


class SectionType(str, enum.Enum):
    travel = "travel"
    stay = "stay"
    activity = "activity"
    other = "other"


class BudgetAllocation(str, enum.Enum):
    """How section.budget is interpreted and spread across days."""
    lump_sum = "lump_sum"  # entire amount on start date
    spread_dates = "spread_dates"  # split evenly across date range
    per_day = "per_day"  # budget is daily rate × days in range
    city_total = "city_total"  # split across stop arrival–departure
    trip_total = "trip_total"  # split across full trip


class ExpenseCategory(str, enum.Enum):
    transport = "transport"
    stay = "stay"
    activities = "activities"
    meals = "meals"
    other = "other"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    language_pref: Mapped[str | None] = mapped_column(String(32), nullable=True)
    phone_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    city: Mapped[str | None] = mapped_column(String(128), nullable=True)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    home_city_id: Mapped[int | None] = mapped_column(
        ForeignKey("cities.id", ondelete="SET NULL"), nullable=True
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.user,
        server_default=UserRole.user.value,
    )
    is_suspended: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    trips: Mapped[list["Trip"]] = relationship(back_populates="user")
    community_posts: Mapped[list["CommunityPost"]] = relationship(back_populates="user")
    community_comments: Mapped[list["CommunityComment"]] = relationship(back_populates="user")


class City(Base):
    __tablename__ = "cities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    country: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    cost_index: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    popularity_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    activities: Mapped[list["Activity"]] = relationship(back_populates="city")
    stops: Mapped[list["Stop"]] = relationship(back_populates="city")


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    type: Mapped[ActivityType] = mapped_column(Enum(ActivityType, name="activity_type"), nullable=False)
    cost: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    duration_mins: Mapped[int] = mapped_column(Integer, nullable=False, default=60)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    city: Mapped["City"] = relationship(back_populates="activities")
    trip_activities: Mapped[list["TripActivity"]] = relationship(back_populates="activity")


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[TripStatus] = mapped_column(
        Enum(TripStatus, name="trip_status"),
        nullable=False,
        default=TripStatus.planning,
    )
    is_public: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="trips")
    stops: Mapped[list["Stop"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    expenses: Mapped[list["Expense"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    shared_trips: Mapped[list["SharedTrip"]] = relationship(back_populates="trip", cascade="all, delete-orphan")
    community_posts: Mapped[list["CommunityPost"]] = relationship(back_populates="trip")


class Stop(Base):
    __tablename__ = "stops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    city_id: Mapped[int] = mapped_column(ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    arrival_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    departure_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    trip: Mapped["Trip"] = relationship(back_populates="stops")
    city: Mapped["City"] = relationship(back_populates="stops")
    sections: Mapped[list["TripSection"]] = relationship(
        back_populates="stop", cascade="all, delete-orphan"
    )


class TripSection(Base):
    __tablename__ = "trip_sections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    stop_id: Mapped[int] = mapped_column(ForeignKey("stops.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[SectionType] = mapped_column(Enum(SectionType, name="section_type"), nullable=False)
    date_range_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_range_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    budget_allocation: Mapped[str] = mapped_column(
        String(32), nullable=False, default=BudgetAllocation.spread_dates.value, server_default="spread_dates"
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    stop: Mapped["Stop"] = relationship(back_populates="sections")
    trip_activities: Mapped[list["TripActivity"]] = relationship(
        back_populates="section", cascade="all, delete-orphan"
    )
    expenses: Mapped[list["Expense"]] = relationship(back_populates="section")


class TripActivity(Base):
    __tablename__ = "trip_activities"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    section_id: Mapped[int] = mapped_column(
        ForeignKey("trip_sections.id", ondelete="CASCADE"), nullable=False
    )
    activity_id: Mapped[int | None] = mapped_column(
        ForeignKey("activities.id", ondelete="SET NULL"), nullable=True
    )
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    scheduled_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    cost_override: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    custom_label: Mapped[str | None] = mapped_column(String(255), nullable=True)

    section: Mapped["TripSection"] = relationship(back_populates="trip_activities")
    activity: Mapped["Activity | None"] = relationship(back_populates="trip_activities")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    category: Mapped[ExpenseCategory] = mapped_column(
        Enum(ExpenseCategory, name="expense_category"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    section_id: Mapped[int | None] = mapped_column(
        ForeignKey("trip_sections.id", ondelete="SET NULL"), nullable=True
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    expense_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    receipt_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    trip: Mapped["Trip"] = relationship(back_populates="expenses")
    section: Mapped["TripSection | None"] = relationship(back_populates="expenses")


class SharedTrip(Base):
    __tablename__ = "shared_trips"
    __table_args__ = (UniqueConstraint("public_slug", name="uq_shared_trips_public_slug"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    public_slug: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    trip: Mapped["Trip"] = relationship(back_populates="shared_trips")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trip_id: Mapped[int | None] = mapped_column(
        ForeignKey("trips.id", ondelete="SET NULL"), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship(back_populates="community_posts")
    trip: Mapped["Trip | None"] = relationship(back_populates="community_posts")
    comments: Mapped[list["CommunityComment"]] = relationship(
        back_populates="post", cascade="all, delete-orphan"
    )


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("community_posts.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    post: Mapped["CommunityPost"] = relationship(back_populates="comments")
    user: Mapped["User"] = relationship(back_populates="community_comments")
