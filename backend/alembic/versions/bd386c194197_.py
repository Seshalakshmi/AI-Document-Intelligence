"""empty message

Revision ID: bd386c194197
Revises: d7ef61602818
Create Date: 2026-07-15 09:46:35.525035

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'bd386c194197'
down_revision: Union[str, Sequence[str], None] = 'd7ef61602818'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
