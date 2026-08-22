"""add users.home_city_id

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-08-22 14:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("home_city_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_home_city_id_cities",
        "users",
        "cities",
        ["home_city_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint("fk_users_home_city_id_cities", "users", type_="foreignkey")
    op.drop_column("users", "home_city_id")
