"""add user_id to jobs table

Revision ID: 6723ea05c01d
Revises: a65324b73288
Create Date: 2025-02-21 21:10:53.162262

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6723ea05c01d'
down_revision: Union[str, None] = 'a65324b73288'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # Add user_id column to jobs table with a foreign key to users(id)
    op.add_column('jobs', sa.Column('user_id', sa.Integer(), nullable=False,
                  server_default='1'))  # Default to user ID 1 for existing rows
    op.create_foreign_key('fk_jobs_user_id_users', 'jobs',
                          'users', ['user_id'], ['id'])


def downgrade():
    # Remove the user_id column and its foreign key
    op.drop_constraint('fk_jobs_user_id_users', 'jobs', type_='foreignkey')
    op.drop_column('jobs', 'user_id')
