"""expense manual fields

Revision ID: a1b2c3d4e5f6
Revises: b23a618f6111
Create Date: 2026-08-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "b23a618f6111"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("expenses", sa.Column("note", sa.Text(), nullable=True))
    op.add_column("expenses", sa.Column("expense_date", sa.Date(), nullable=True))
    op.add_column("expenses", sa.Column("receipt_url", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("expenses", "receipt_url")
    op.drop_column("expenses", "expense_date")
    op.drop_column("expenses", "note")
