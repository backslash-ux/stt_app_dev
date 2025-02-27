"""Add segments column to transcription_history

Revision ID: 6eb06baeb4a7
Revises: da767218daed
Create Date: 2025-02-27 21:15:49.765381

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '6eb06baeb4a7'
down_revision = 'da767218daed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('transcription_history', sa.Column(
        'segments', sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column('transcription_history', 'segments')
