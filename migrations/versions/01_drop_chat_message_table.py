"""Drop chat_message table

Revision ID: 01_drop_chat_message
Revises: 
Create Date: 2024-07-10

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine import reflection


# revision identifiers, used by Alembic.
revision = '01_drop_chat_message'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Drop the chat_message table
    op.execute("DROP TABLE IF EXISTS chat_message")


def downgrade():
    # Recreate the chat_message table
    op.create_table('chat_message',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.Column('has_link', sa.Boolean(), nullable=True),
        sa.Column('tournament_link', sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    ) 