"""
    remove chat message table
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'remove_chat_message'
down_revision = None
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