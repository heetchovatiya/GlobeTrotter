"""add trip_sections.budget_allocation

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-08-22 15:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "trip_sections",
        sa.Column(
            "budget_allocation",
            sa.String(length=32),
            nullable=False,
            server_default="spread_dates",
        ),
    )


def downgrade() -> None:
    op.drop_column("trip_sections", "budget_allocation")
