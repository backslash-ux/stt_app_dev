"""Fresh migration to align schema

Revision ID: 3ba4c96827ee
Revises: 8c8d77d97e74
Create Date: 2025-02-27 23:14:48.731308

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

# Revision identifiers
revision: str = '3ba4c96827ee'
down_revision: Union[str, None] = '8c8d77d97e74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(table_name: str, conn) -> bool:
    """Helper function to check if a table exists in the database."""
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    conn = op.get_bind()

    # Users table
    if not table_exists("users", conn):
        op.create_table('users',
                        sa.Column('id', sa.Integer(), nullable=False),
                        sa.Column('email', sa.String(), nullable=False),
                        sa.Column('password_hash',
                                  sa.String(), nullable=False),
                        sa.PrimaryKeyConstraint('id'),
                        sa.UniqueConstraint('email', name='ix_users_email')
                        )

    # Transcription History table
    if not table_exists("transcription_history", conn):
        op.create_table('transcription_history',
                        sa.Column('id', sa.Integer(), nullable=False),
                        sa.Column('user_id', sa.Integer(), nullable=False),
                        sa.Column('source', sa.String(), nullable=False),
                        sa.Column('video_url', sa.Text(), nullable=True),
                        sa.Column('transcript', sa.Text(), nullable=False),
                        sa.Column('created_at', sa.TIMESTAMP(),
                                  server_default=sa.text('CURRENT_TIMESTAMP')),
                        sa.Column('title', sa.String(), nullable=True),
                        sa.Column('segments', sa.Text(), nullable=True),
                        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
                        sa.PrimaryKeyConstraint('id')
                        )

    # Content Generation table
    if not table_exists("content_generation", conn):
        op.create_table('content_generation',
                        sa.Column('id', sa.Integer(), nullable=False),
                        sa.Column('user_id', sa.Integer(), nullable=False),
                        sa.Column('transcription_history_id',
                                  sa.Integer(), nullable=False),
                        sa.Column('generated_content',
                                  sa.Text(), nullable=False),
                        sa.Column('created_at', sa.TIMESTAMP(),
                                  server_default=sa.text('CURRENT_TIMESTAMP')),
                        sa.Column('title', sa.String(), nullable=True),
                        sa.Column('config', postgresql.JSON(), nullable=True),
                        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
                        sa.ForeignKeyConstraint(['transcription_history_id'], [
                            'transcription_history.id']),
                        sa.PrimaryKeyConstraint('id')
                        )

    # Jobs table
    if not table_exists("jobs", conn):
        op.create_table('jobs',
                        sa.Column('id', sa.String(), nullable=False),
                        sa.Column('status', sa.String(), nullable=False),
                        sa.Column('transcript', sa.Text(), nullable=True),
                        sa.Column('created_at', sa.TIMESTAMP(), nullable=True),
                        sa.Column('completed_at',
                                  sa.TIMESTAMP(), nullable=True),
                        sa.Column('title', sa.String(), nullable=True),
                        sa.Column('user_id', sa.Integer(),
                                  nullable=False, server_default='1'),
                        sa.ForeignKeyConstraint(
                            ['user_id'], ['users.id'], name='fk_jobs_user_id_users'),
                        sa.PrimaryKeyConstraint('id')
                        )

    # Indexes (skip if they already exist)
    if not table_exists("users", conn):
        op.create_index('ix_users_id', 'users', ['id'], unique=False)
    if not table_exists("transcription_history", conn):
        op.create_index('ix_transcription_history_id',
                        'transcription_history', ['id'], unique=False)
    if not table_exists("content_generation", conn):
        op.create_index('ix_content_generation_id',
                        'content_generation', ['id'], unique=False)
    if not table_exists("jobs", conn):
        op.create_index('ix_jobs_id', 'jobs', ['id'], unique=False)


def downgrade() -> None:
    conn = op.get_bind()

    # Drop indexes before dropping tables
    if table_exists("jobs", conn):
        op.drop_index('ix_jobs_id', table_name='jobs')
    if table_exists("content_generation", conn):
        op.drop_index('ix_content_generation_id',
                      table_name='content_generation')
    if table_exists("transcription_history", conn):
        op.drop_index('ix_transcription_history_id',
                      table_name='transcription_history')
    if table_exists("users", conn):
        op.drop_index('ix_users_id', table_name='users')

    # Drop tables only if they exist
    if table_exists("jobs", conn):
        op.drop_table('jobs')
    if table_exists("content_generation", conn):
        op.drop_table('content_generation')
    if table_exists("transcription_history", conn):
        op.drop_table('transcription_history')
    if table_exists("users", conn):
        op.drop_table('users')
