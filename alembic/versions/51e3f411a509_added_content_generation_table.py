"""Added content generation table

Revision ID: 51e3f411a509
Revises: <previous_revision_id>
Create Date: 2025-02-27 <time>
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '51e3f411a509'
down_revision = '<previous_revision_id>'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the index if it exists
    op.execute("DROP INDEX IF EXISTS ix_content_generation_id")
    # Then create the index
    op.create_index("ix_content_generation_id",
                    "content_generation", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_content_generation_id", table_name="content_generation")
