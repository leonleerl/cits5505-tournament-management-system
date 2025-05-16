"""Update database schema

Revision ID: 091d8ece6b36
Revises: remove_chat_message
Create Date: 2025-05-16 11:57:29.631828

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '091d8ece6b36'
down_revision = 'remove_chat_message'
branch_labels = None
depends_on = None


def upgrade():
    op.drop_table('chat_message')

def downgrade():
    op.create_table('chat_message',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('sender_id', sa.Integer(), nullable=False),
        sa.Column('receiver_id', sa.Integer(), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['receiver_id'], ['user.id'], ),
        sa.ForeignKeyConstraint(['sender_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    ) 