# alembic/versions/95227221e452_add_user_id_to_jobs_table.py
"""add user_id to jobs table

Revision ID: 95227221e452
Revises: 6723ea05c01d  # Adjust to your base migration
Create Date: 2025-02-21 00:00:00
"""

from alembic import op
import sqlalchemy as sa

revision = '95227221e452'
down_revision = '6723ea05c01d'  # Base migration
branch_labels = None
depends_on = None


def upgrade():
    if not op.get_bind().dialect.has_column(op.get_bind(), 'jobs', 'user_id'):
        op.add_column('jobs', sa.Column('user_id', sa.String(),
                      nullable=False, server_default='1'))
        op.create_foreign_key('fk_jobs_user_id_users',
                              'jobs', 'users', ['user_id'], ['id'])
    else:
        print("Column 'user_id' already exists in 'jobs' table, skipping addition.")


def downgrade():
    if op.get_bind().dialect.has_column(op.get_bind(), 'jobs', 'user_id'):
        op.drop_constraint('fk_jobs_user_id_users', 'jobs', type_='foreignkey')
        op.drop_column('jobs', 'user_id')
