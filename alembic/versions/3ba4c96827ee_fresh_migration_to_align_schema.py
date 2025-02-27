"""Fresh migration to align schema

Revision ID: 3ba4c96827ee
Revises: 8c8d77d97e74
Create Date: 2025-02-27 23:14:48.731308

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# Revision identifiers
revision: str = '3ba4c96827ee'
down_revision: Union[str, None] = '8c8d77d97e74'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure all tables exist as per schema dump

    # Users table
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('password_hash', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email', name='ix_users_email')
    )
    
    # Transcription History table
    op.create_table('transcription_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('source', sa.String(), nullable=False),
        sa.Column('video_url', sa.Text(), nullable=True),
        sa.Column('transcript', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('segments', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Content Generation table
    op.create_table('content_generation',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('transcription_history_id', sa.Integer(), nullable=False),
        sa.Column('generated_content', sa.Text(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('config', postgresql.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['transcription_history_id'], ['transcription_history.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # Jobs table
    op.create_table('jobs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('transcript', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('user_id', sa.Integer(), nullable=False, server_default='1'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_jobs_user_id_users'),
        sa.PrimaryKeyConstraint('id')
    )

    # Indexes
    op.create_index('ix_users_id', 'users', ['id'], unique=False)
    op.create_index('ix_transcription_history_id', 'transcription_history', ['id'], unique=False)
    op.create_index('ix_content_generation_id', 'content_generation', ['id'], unique=False)
    op.create_index('ix_jobs_id', 'jobs', ['id'], unique=False)


def downgrade() -> None:
    # Drop tables and indexes in reverse order
    op.drop_index('ix_jobs_id', table_name='jobs')
    op.drop_index('ix_content_generation_id', table_name='content_generation')
    op.drop_index('ix_transcription_history_id', table_name='transcription_history')
    op.drop_index('ix_users_id', table_name='users')

    op.drop_table('jobs')
    op.drop_table('content_generation')
    op.drop_table('transcription_history')
    op.drop_table('users')
