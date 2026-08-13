"""Add document embedding table

Revision ID: 86b6f7f8126f
Revises: bd386c194197
Create Date: 2026-07-15 10:00:25.025958

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '86b6f7f8126f'
down_revision: Union[str, Sequence[str], None] = 'bd386c194197'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "document_embeddings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("chunk_id", sa.Integer(), nullable=False),
        sa.Column("embedding", Vector(384), nullable=False),
        sa.Column("embedding_model", sa.String(length=255), nullable=False),
        sa.Column("embedding_dimension", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["chunk_id"], ["document_chunks.id"]),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        op.f("ix_document_embeddings_id"),
        "document_embeddings",
        ["id"],
        unique=False
    )

    op.create_index(
        op.f("ix_document_embeddings_document_id"),
        "document_embeddings",
        ["document_id"],
        unique=False
    )

    op.create_index(
        op.f("ix_document_embeddings_chunk_id"),
        "document_embeddings",
        ["chunk_id"],
        unique=True
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_document_embeddings_chunk_id"),
        table_name="document_embeddings"
    )

    op.drop_index(
        op.f("ix_document_embeddings_document_id"),
        table_name="document_embeddings"
    )

    op.drop_index(
        op.f("ix_document_embeddings_id"),
        table_name="document_embeddings"
    )

    op.drop_table("document_embeddings")
