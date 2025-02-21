"""add title to jobs table

Revision ID: e998de66fe2d
Revises: 6723ea05c01d
Create Date: 2025-02-21 22:04:04.366195

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e998de66fe2d'
down_revision: Union[str, None] = '6723ea05c01d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Nullable to avoid backfill issues
    op.add_column('jobs', sa.Column('title', sa.String(), nullable=True))


def downgrade():
    op.drop_column('jobs', 'title')
