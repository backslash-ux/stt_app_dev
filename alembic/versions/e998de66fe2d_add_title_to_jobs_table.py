# alembic/versions/e998de66fe2d_add_title_to_jobs_table.py
"""add title to jobs table

Revision ID: e998de66fe2d
Revises: 95227221e452
Create Date: 2025-02-21 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = 'e998de66fe2d'
down_revision = '95227221e452'
branch_labels = None
depends_on = None


def upgrade():
    # Use inspector to check if 'title' column exists
    inspector = inspect(op.get_bind())
    columns = [col['name'] for col in inspector.get_columns('jobs')]
    if 'title' not in columns:
        op.add_column('jobs', sa.Column('title', sa.String(), nullable=True))
    else:
        print("Column 'title' already exists in 'jobs' table, skipping addition.")


def downgrade():
    inspector = inspect(op.get_bind())
    columns = [col['name'] for col in inspector.get_columns('jobs')]
    if 'title' in columns:
        op.drop_column('jobs', 'title')
