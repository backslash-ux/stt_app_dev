"""add user_id to jobs table corrected

Revision ID: da767218daed
Revises: e998de66fe2d
Create Date: 2025-02-23 01:26:45.021715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'da767218daed'
down_revision: Union[str, None] = 'e998de66fe2d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column('jobs', sa.Column('user_id', sa.Integer(), nullable=False, server_default='1'))
    op.create_foreign_key('fk_jobs_user_id_users', 'jobs', 'users', ['user_id'], ['id'])

def downgrade():
    op.drop_constraint('fk_jobs_user_id_users', 'jobs', type_='foreignkey')
    op.drop_column('jobs', 'user_id')
