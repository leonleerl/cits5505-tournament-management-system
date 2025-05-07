from app.models.database import db
from sqlalchemy import desc

class User(db.Model):
    __tablename__ = 'User'
    
    UserId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Username = db.Column(db.String, unique=True, nullable=False)
    Password = db.Column(db.String, nullable=False)
    Email = db.Column(db.String, unique=True, nullable=False)
    Avatar = db.Column(db.String)
    IsAdmin = db.Column(db.Boolean, nullable=False, default=False)
    
    # Relationships
    created_matches = db.relationship('Match', backref='creator', lazy=True)

class Team(db.Model):
    __tablename__ = 'Team'
    
    TeamId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String, unique=True, nullable=False)
    Description = db.Column(db.String)
    CreatedYear = db.Column(db.Integer)
    
    # Relationships
    players = db.relationship('Player', backref='team', lazy=True)
    team1_matches = db.relationship('Match', foreign_keys='Match.TeamId1', backref='team1', lazy=True)
    team2_matches = db.relationship('Match', foreign_keys='Match.TeamId2', backref='team2', lazy=True)
    
    # Virtual attributes for leaderboard
    @property
    def wins(self):
        # Team wins as team1
        team1_wins = Match.query.join(Score, Match.MatchId == Score.MatchId)\
            .filter(Match.TeamId1 == self.TeamId, 
                   Score.Team1Score > Score.Team2Score, 
                   Match.Status == 2).count()
        
        # Team wins as team2
        team2_wins = Match.query.join(Score, Match.MatchId == Score.MatchId)\
            .filter(Match.TeamId2 == self.TeamId, 
                   Score.Team2Score > Score.Team1Score, 
                   Match.Status == 2).count()
        
        return team1_wins + team2_wins
    
    @property
    def losses(self):
        # Team losses as team1
        team1_losses = Match.query.join(Score, Match.MatchId == Score.MatchId)\
            .filter(Match.TeamId1 == self.TeamId, 
                   Score.Team1Score < Score.Team2Score, 
                   Match.Status == 2).count()
        
        # Team losses as team2
        team2_losses = Match.query.join(Score, Match.MatchId == Score.MatchId)\
            .filter(Match.TeamId2 == self.TeamId, 
                   Score.Team2Score < Score.Team1Score, 
                   Match.Status == 2).count()
        
        return team1_losses + team2_losses
    
    @property
    def points(self):
        # Calculate points (2 points per win)
        return self.wins * 2

class Player(db.Model):
    __tablename__ = 'Player'
    
    PlayerId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String, nullable=False)
    Height = db.Column(db.Float)
    Weight = db.Column(db.Float)
    TeamId = db.Column(db.Integer, db.ForeignKey('Team.TeamId'))

class Season(db.Model):
    __tablename__ = 'Season'
    
    SeasonId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String, nullable=False)
    Year = db.Column(db.Integer, nullable=False)
    Status = db.Column(db.Integer, nullable=False)
    
    # Relationships
    matches = db.relationship('Match', backref='season', lazy=True)

class Stadium(db.Model):
    __tablename__ = 'Stadium'
    
    StadiumId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Name = db.Column(db.String, nullable=False)
    Location = db.Column(db.String, nullable=False)
    
    # Relationships
    matches = db.relationship('Match', backref='stadium', lazy=True)

class Match(db.Model):
    __tablename__ = 'Match'
    
    MatchId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    TeamId1 = db.Column(db.Integer, db.ForeignKey('Team.TeamId'), nullable=False)
    TeamId2 = db.Column(db.Integer, db.ForeignKey('Team.TeamId'), nullable=False)
    Status = db.Column(db.Integer, nullable=False)  # 0: upcoming, 1: in progress, 2: completed
    MatchDate = db.Column(db.Date, nullable=False)
    SeasonId = db.Column(db.Integer, db.ForeignKey('Season.SeasonId'), nullable=False)
    StadiumId = db.Column(db.Integer, db.ForeignKey('Stadium.StadiumId'), nullable=False)
    CreatorId = db.Column(db.Integer, db.ForeignKey('User.UserId'), nullable=False)
    
    # Relationships
    score = db.relationship('Score', backref='match', uselist=False, lazy=True)

class Score(db.Model):
    __tablename__ = 'Score'
    
    ScoreId = db.Column(db.Integer, primary_key=True, autoincrement=True)
    MatchId = db.Column(db.Integer, db.ForeignKey('Match.MatchId'), nullable=False, unique=True)
    Team1Score = db.Column(db.Integer, nullable=False)
    Team2Score = db.Column(db.Integer, nullable=False) 