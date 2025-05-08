from app.models.database import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

class User(db.Model, UserMixin):
    __tablename__ = 'user'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    date_joined = db.Column(db.DateTime, default=datetime.utcnow)
    
    tournaments = db.relationship('Tournament', backref='creator', lazy=True)
    teams = db.relationship('Team', backref='creator', lazy=True)
    players = db.relationship('Player', backref='creator', lazy=True)
    matches = db.relationship('Match', backref='creator', lazy=True)
    chat_messages = db.relationship('ChatMessage', backref='user', lazy=True)
    tournament_access = db.relationship('TournamentAccess', backref='user', lazy=True)  # Added relationship
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Tournament(db.Model):
    __tablename__ = 'tournament'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    year = db.Column(db.Integer, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    teams = db.relationship('Team', backref='tournament', lazy=True)
    matches = db.relationship('Match', backref='tournament', lazy=True)
    tournament_access = db.relationship('TournamentAccess', backref='tournament', lazy=True)

class TournamentAccess(db.Model):
    __tablename__ = 'tournament_access'
    
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournament.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    access_granted = db.Column(db.DateTime, default=datetime.utcnow)

class Team(db.Model):
    __tablename__ = 'team'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_year = db.Column(db.Integer, nullable=True)
    logo_shape_type = db.Column(db.Integer, default=1)
    primary_color = db.Column(db.String(7), default='#000000')
    secondary_color = db.Column(db.String(7), default='#FFFFFF')
    wins = db.Column(db.Integer, default=0)
    losses = db.Column(db.Integer, default=0)
    points = db.Column(db.Integer, default=0)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournament.id'), nullable=False)
    
    players = db.relationship('Player', backref='team', lazy=True)
    team1_matches = db.relationship('Match', foreign_keys='Match.team1_id', backref='team1', lazy=True)
    team2_matches = db.relationship('Match', foreign_keys='Match.team2_id', backref='team2', lazy=True)

class Player(db.Model):
    __tablename__ = 'player'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    height = db.Column(db.Integer, nullable=True)  # in cm
    weight = db.Column(db.Integer, nullable=True)  # in kg
    position = db.Column(db.String(2), nullable=False)  # PG, SG, SF, PF, C
    jersey_number = db.Column(db.Integer, nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    stats = db.relationship('PlayerStats', backref='player', lazy=True)

class Match(db.Model):
    __tablename__ = 'match'
    
    id = db.Column(db.Integer, primary_key=True)
    tournament_id = db.Column(db.Integer, db.ForeignKey('tournament.id'), nullable=False)
    team1_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    team2_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    venue_name = db.Column(db.String(100), nullable=True)
    match_date = db.Column(db.DateTime, nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    score = db.relationship('MatchScore', backref='match', uselist=False, lazy=True)
    player_stats = db.relationship('PlayerStats', backref='match', lazy=True)

class MatchScore(db.Model):
    __tablename__ = 'match_score'
    
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=False, unique=True)
    team1_score = db.Column(db.Integer, nullable=False)
    team2_score = db.Column(db.Integer, nullable=False)

class PlayerStats(db.Model):
    __tablename__ = 'player_stats'
    
    id = db.Column(db.Integer, primary_key=True)
    match_id = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=False)
    player_id = db.Column(db.Integer, db.ForeignKey('player.id'), nullable=False)
    points = db.Column(db.Integer, default=0)
    rebounds = db.Column(db.Integer, default=0)
    assists = db.Column(db.Integer, default=0)
    steals = db.Column(db.Integer, default=0)
    blocks = db.Column(db.Integer, default=0)
    turnovers = db.Column(db.Integer, default=0)
    three_pointers = db.Column(db.Integer, default=0)
    
    # Calculated fields
    efficiency = db.Column(db.Integer, default=0)
    double_double = db.Column(db.Boolean, default=False)
    triple_double = db.Column(db.Boolean, default=False)

class ChatMessage(db.Model):
    __tablename__ = 'chat_message'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    has_link = db.Column(db.Boolean, default=False)
    tournament_link = db.Column(db.String(255), nullable=True)

# Add event listeners for calculated fields
@db.event.listens_for(PlayerStats, 'before_insert')
@db.event.listens_for(PlayerStats, 'before_update')
def set_calculated_fields(mapper, connection, target):
    # Calculate efficiency
    target.efficiency = (target.points + target.rebounds + target.assists + 
                         target.steals + target.blocks - target.turnovers)
    
    # Calculate double_double
    categories = [target.points, target.rebounds, target.assists, 
                 target.steals, target.blocks]
    target.double_double = sum(1 for cat in categories if cat >= 10) >= 2
    
    # Calculate triple_double
    target.triple_double = sum(1 for cat in categories if cat >= 10) >= 3