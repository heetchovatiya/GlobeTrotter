from datetime import date

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_role
from app.crud import exports as exports_crud
from app.models import User

router = APIRouter()


def _csv_response(content: str, filename: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/trips/export.csv")
def export_all_trips_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    content = exports_crud.all_trips_csv(db, current_user)
    return _csv_response(content, "globetrotter-trips.csv")


@router.get("/trips/{trip_id}/export/budget.csv")
def export_trip_budget_csv(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    content = exports_crud.budget_csv(db, trip_id, current_user)
    return _csv_response(content, f"trip-{trip_id}-budget.csv")


@router.get("/trips/{trip_id}/export/summary.csv")
def export_trip_summary_csv(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    content = exports_crud.summary_csv(db, trip_id, current_user)
    return _csv_response(content, f"trip-{trip_id}-plan.csv")


@router.get("/users/me/travel-ledger/export.csv")
def export_travel_ledger_csv(
    status: str | None = Query(default=None),
    start_from: date | None = Query(default=None),
    start_to: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    content = exports_crud.travel_ledger_csv(
        db, current_user, status_filter=status, start_from=start_from, start_to=start_to
    )
    return _csv_response(content, "travel-ledger.csv")


@router.get("/admin/export/trips.csv")
def admin_export_trips_csv(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> Response:
    content = exports_crud.admin_all_trips_csv(db)
    return _csv_response(content, "admin-all-trips.csv")


@router.get("/admin/export/users.csv")
def admin_export_users_csv(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_role("admin")),
) -> Response:
    content = exports_crud.admin_all_users_csv(db)
    return _csv_response(content, "admin-all-users.csv")
