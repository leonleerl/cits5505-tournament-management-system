#!/usr/bin/env python
# seed_db.py
# This script populates the database with initial seed data
# Run this after recreate_db.py and app.py have been executed to create the schema

import os
import sys
from datetime import datetime, timedelta
from flask import Flask
from werkzeug.security import generate_password_hash
from app.models.database import db
from app.models.models import (
    User, Tournament, Team, Player, Match, 
    MatchScore, PlayerStats, TournamentAccess
)

# Initialize Flask app (minimal configuration, just for database setup)
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI') or f'sqlite:///{os.path.abspath("db/cits5505.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def create_seed_data():
    """Create and insert seed data into the database"""
    
    PlayerStats.query.delete()
    MatchScore.query.delete()
    Player.query.delete()
    Match.query.delete()
    Team.query.delete()
    TournamentAccess.query.delete()
    Tournament.query.delete()
    User.query.delete()
    
    print("Creating seed data...")
    
    # Create users
    admin = User(
        full_name="Admin User",
        username="admin",
        email="admin@example.com",
        password_hash=generate_password_hash("admin123"),
        date_joined=datetime.utcnow()
    )
    
    user1 = User(
        full_name="John Doe",
        username="johndoe",
        email="john@example.com",
        password_hash=generate_password_hash("password123"),
        date_joined=datetime.utcnow()
    )

    user2 = User(
        full_name="Jane Smith",
        username="janesmith",
        email="jane@example.com",
        password_hash=generate_password_hash("password123"),
        date_joined=datetime.utcnow()
    )
    
    # Add more users
    user3 = User(
        full_name="Michael Johnson",
        username="michaelj",
        email="michael@example.com",
        password_hash=generate_password_hash("password123"),
        date_joined=datetime.utcnow() - timedelta(days=30)
    )
    
    user4 = User(
        full_name="Sarah Williams",
        username="sarahw",
        email="sarah@example.com",
        password_hash=generate_password_hash("password123"),
        date_joined=datetime.utcnow() - timedelta(days=15)
    )
    
    db.session.add_all([admin, user1, user2, user3, user4])
    db.session.commit()
    
    # Create tournaments
    current_year = datetime.now().year
    
    tournament1 = Tournament(
        name="Summer Basketball League",
        description="Annual summer basketball tournament with teams from across the state.",
        year=current_year,
        start_date=datetime(current_year, 6, 1).date(),
        end_date=datetime(current_year, 8, 30).date(),
        creator_id=admin.id
    )
    
    tournament2 = Tournament(
        name="University Championship",
        description="Inter-university basketball championship featuring top college teams.",
        year=current_year,
        start_date=datetime(current_year, 3, 15).date(),
        end_date=datetime(current_year, 5, 25).date(),
        creator_id=user1.id
    )
    
    # Add more tournaments
    tournament3 = Tournament(
        name="City Cup",
        description="Local tournament for city teams with different age divisions.",
        year=current_year,
        start_date=datetime(current_year, 7, 10).date(),
        end_date=datetime(current_year, 8, 15).date(),
        creator_id=user2.id
    )
    
    tournament4 = Tournament(
        name="Winter Classic",
        description="Indoor winter basketball tournament with professional and amateur teams.",
        year=current_year,
        start_date=datetime(current_year, 11, 1).date(),
        end_date=datetime(current_year, 12, 15).date(),
        creator_id=admin.id
    )
    
    tournament5 = Tournament(
        name="Youth Development League",
        description="Tournament aimed at developing young basketball talent under 18.",
        year=current_year,
        start_date=datetime(current_year, 4, 5).date(),
        end_date=datetime(current_year, 6, 20).date(),
        creator_id=user3.id
    )
    
    tournament6 = Tournament(
        name="Corporate Challenge",
        description="Basketball tournament between corporate teams for charity.",
        year=current_year,
        start_date=datetime(current_year, 9, 10).date(),
        end_date=datetime(current_year, 10, 25).date(),
        creator_id=user4.id
    )
    
    db.session.add_all([tournament1, tournament2, tournament3, tournament4, tournament5, tournament6])
    db.session.commit()
    
    # Grant access to tournaments
    access1 = TournamentAccess(
        tournament_id=tournament1.id,
        user_id=user1.id,
        access_granted=datetime.utcnow()
    )
    
    access2 = TournamentAccess(
        tournament_id=tournament2.id,
        user_id=user2.id,
        access_granted=datetime.utcnow()
    )
    
    # Add more tournament access grants
    access3 = TournamentAccess(
        tournament_id=tournament3.id,
        user_id=user3.id,
        access_granted=datetime.utcnow() - timedelta(days=5)
    )
    
    access4 = TournamentAccess(
        tournament_id=tournament4.id,
        user_id=user4.id,
        access_granted=datetime.utcnow() - timedelta(days=2)
    )
    
    access5 = TournamentAccess(
        tournament_id=tournament1.id,
        user_id=user4.id,
        access_granted=datetime.utcnow() - timedelta(days=10)
    )
    
    access6 = TournamentAccess(
        tournament_id=tournament5.id,
        user_id=user1.id,
        access_granted=datetime.utcnow() - timedelta(days=3)
    )
    
    db.session.add_all([access1, access2, access3, access4, access5, access6])
    db.session.commit()
    
    # Create teams for tournament 1
    team1 = Team(
        name="Thunder Hawks",
        created_year=2010,
        logo_shape_type=1,
        primary_color="#0066cc",
        secondary_color="#ffffff",
        wins=0,
        losses=0,
        points=0,
        creator_id=admin.id,
        tournament_id=tournament1.id
    )
    
    team2 = Team(
        name="Red Dragons",
        created_year=2008,
        logo_shape_type=2,
        primary_color="#cc0000",
        secondary_color="#ffcc00",
        wins=0,
        losses=0,
        points=0,
        creator_id=admin.id,
        tournament_id=tournament1.id
    )
    
    # Create teams for tournament 2
    team3 = Team(
        name="UWA Wildcats",
        created_year=2015,
        logo_shape_type=3,
        primary_color="#006633",
        secondary_color="#ffcc00",
        wins=0,
        losses=0,
        points=0,
        creator_id=user1.id,
        tournament_id=tournament2.id
    )
    
    team4 = Team(
        name="Curtin Eagles",
        created_year=2012,
        logo_shape_type=4,
        primary_color="#000066",
        secondary_color="#ffffff",
        wins=0,
        losses=0,
        points=0,
        creator_id=user1.id,
        tournament_id=tournament2.id
    )
    
    # Add more teams to tournament 1
    team5 = Team(
        name="Blue Sharks",
        created_year=2013,
        logo_shape_type=1,
        primary_color="#0099ff",
        secondary_color="#000000",
        wins=0,
        losses=0,
        points=0,
        creator_id=admin.id,
        tournament_id=tournament1.id
    )
    
    team6 = Team(
        name="Green Giants",
        created_year=2011,
        logo_shape_type=3,
        primary_color="#33cc33",
        secondary_color="#ffffff",
        wins=0,
        losses=0,
        points=0,
        creator_id=admin.id,
        tournament_id=tournament1.id
    )
    
    # Add more teams to tournament 2
    team7 = Team(
        name="Murdoch Flames",
        created_year=2014,
        logo_shape_type=2,
        primary_color="#ff6600",
        secondary_color="#000000",
        wins=0,
        losses=0,
        points=0,
        creator_id=user1.id,
        tournament_id=tournament2.id
    )
    
    team8 = Team(
        name="ECU Titans",
        created_year=2016,
        logo_shape_type=4,
        primary_color="#660066",
        secondary_color="#ffffff",
        wins=0,
        losses=0,
        points=0,
        creator_id=user1.id,
        tournament_id=tournament2.id
    )
    
    # Add teams to tournament 3
    team9 = Team(
        name="Northside Bulls",
        created_year=2009,
        logo_shape_type=1,
        primary_color="#cc0000",
        secondary_color="#000000",
        wins=0,
        losses=0,
        points=0,
        creator_id=user2.id,
        tournament_id=tournament3.id
    )
    
    team10 = Team(
        name="Southside Wolves",
        created_year=2010,
        logo_shape_type=2,
        primary_color="#666666",
        secondary_color="#ffffff",
        wins=0,
        losses=0,
        points=0,
        creator_id=user2.id,
        tournament_id=tournament3.id
    )
    
    team11 = Team(
        name="Eastside Ravens",
        created_year=2011,
        logo_shape_type=3,
        primary_color="#000000",
        secondary_color="#cccccc",
        wins=0,
        losses=0,
        points=0,
        creator_id=user2.id,
        tournament_id=tournament3.id
    )
    
    team12 = Team(
        name="Westside Tigers",
        created_year=2012,
        logo_shape_type=4,
        primary_color="#ff9900",
        secondary_color="#000000",
        wins=0,
        losses=0,
        points=0,
        creator_id=user2.id,
        tournament_id=tournament3.id
    )
    
    db.session.add_all([
        team1, team2, team3, team4, team5, team6,
        team7, team8, team9, team10, team11, team12
    ])
    db.session.commit()
    
    # Create players for team 1
    players_team1 = [
        Player(name="Michael Johnson", height=188, weight=82, position="PG", jersey_number=5, team_id=team1.id, creator_id=admin.id),
        Player(name="David Wilson", height=198, weight=95, position="SG", jersey_number=10, team_id=team1.id, creator_id=admin.id),
        Player(name="Robert Brown", height=203, weight=98, position="SF", jersey_number=15, team_id=team1.id, creator_id=admin.id),
        Player(name="James Davis", height=206, weight=105, position="PF", jersey_number=20, team_id=team1.id, creator_id=admin.id),
        Player(name="Thomas Miller", height=210, weight=112, position="C", jersey_number=25, team_id=team1.id, creator_id=admin.id)
    ]
    
    # Create players for team 2
    players_team2 = [
        Player(name="William Taylor", height=185, weight=80, position="PG", jersey_number=4, team_id=team2.id, creator_id=admin.id),
        Player(name="Joseph Anderson", height=195, weight=92, position="SG", jersey_number=8, team_id=team2.id, creator_id=admin.id),
        Player(name="Daniel White", height=200, weight=96, position="SF", jersey_number=12, team_id=team2.id, creator_id=admin.id),
        Player(name="Matthew Moore", height=205, weight=102, position="PF", jersey_number=16, team_id=team2.id, creator_id=admin.id),
        Player(name="Christopher Martin", height=208, weight=110, position="C", jersey_number=20, team_id=team2.id, creator_id=admin.id)
    ]
    
    # Create players for team 3
    players_team3 = [
        Player(name="Andrew Clark", height=186, weight=81, position="PG", jersey_number=3, team_id=team3.id, creator_id=user1.id),
        Player(name="Ryan Lewis", height=196, weight=93, position="SG", jersey_number=7, team_id=team3.id, creator_id=user1.id),
        Player(name="Kevin Walker", height=202, weight=97, position="SF", jersey_number=11, team_id=team3.id, creator_id=user1.id),
        Player(name="Brian Hall", height=204, weight=103, position="PF", jersey_number=15, team_id=team3.id, creator_id=user1.id),
        Player(name="Jason Allen", height=209, weight=111, position="C", jersey_number=19, team_id=team3.id, creator_id=user1.id)
    ]
    
    # Create players for team 4
    players_team4 = [
        Player(name="Mark Young", height=187, weight=83, position="PG", jersey_number=2, team_id=team4.id, creator_id=user1.id),
        Player(name="Charles Harris", height=197, weight=94, position="SG", jersey_number=6, team_id=team4.id, creator_id=user1.id),
        Player(name="Steven Nelson", height=201, weight=99, position="SF", jersey_number=10, team_id=team4.id, creator_id=user1.id),
        Player(name="Paul Robinson", height=207, weight=104, position="PF", jersey_number=14, team_id=team4.id, creator_id=user1.id),
        Player(name="George King", height=212, weight=113, position="C", jersey_number=18, team_id=team4.id, creator_id=user1.id)
    ]
    
    db.session.add_all(players_team1 + players_team2 + players_team3 + players_team4)
    db.session.commit()
    
    # Create matches
    now = datetime.now()
    
    # Tournament 1 match
    match1 = Match(
        tournament_id=tournament1.id,
        team1_id=team1.id,
        team2_id=team2.id,
        venue_name="Central Stadium",
        match_date=now - timedelta(days=5),
        creator_id=admin.id
    )
    
    # Tournament 2 match
    match2 = Match(
        tournament_id=tournament2.id,
        team1_id=team3.id,
        team2_id=team4.id,
        venue_name="University Arena",
        match_date=now - timedelta(days=2),
        creator_id=user1.id
    )
    
    # Upcoming matches
    match3 = Match(
        tournament_id=tournament1.id,
        team1_id=team1.id,
        team2_id=team2.id,
        venue_name="Central Stadium",
        match_date=now + timedelta(days=5),
        creator_id=admin.id
    )
    
    match4 = Match(
        tournament_id=tournament2.id,
        team1_id=team3.id,
        team2_id=team4.id,
        venue_name="University Arena",
        match_date=now + timedelta(days=10),
        creator_id=user1.id
    )
    
    # Additional past matches for tournament 1
    match5 = Match(
        tournament_id=tournament1.id,
        team1_id=team1.id,
        team2_id=team5.id,
        venue_name="Riverside Court",
        match_date=now - timedelta(days=12),
        creator_id=admin.id
    )
    
    match6 = Match(
        tournament_id=tournament1.id,
        team1_id=team6.id,
        team2_id=team2.id,
        venue_name="Central Stadium",
        match_date=now - timedelta(days=9),
        creator_id=admin.id
    )
    
    match7 = Match(
        tournament_id=tournament1.id,
        team1_id=team5.id,
        team2_id=team6.id,
        venue_name="Riverside Court",
        match_date=now - timedelta(days=7),
        creator_id=admin.id
    )
    
    # Additional past matches for tournament 2
    match8 = Match(
        tournament_id=tournament2.id,
        team1_id=team3.id,
        team2_id=team7.id,
        venue_name="University Arena",
        match_date=now - timedelta(days=10),
        creator_id=user1.id
    )
    
    match9 = Match(
        tournament_id=tournament2.id,
        team1_id=team8.id,
        team2_id=team4.id,
        venue_name="College Stadium",
        match_date=now - timedelta(days=8),
        creator_id=user1.id
    )
    
    match10 = Match(
        tournament_id=tournament2.id,
        team1_id=team7.id,
        team2_id=team8.id,
        venue_name="University Arena",
        match_date=now - timedelta(days=4),
        creator_id=user1.id
    )
    
    # Matches for tournament 3
    match11 = Match(
        tournament_id=tournament3.id,
        team1_id=team9.id,
        team2_id=team10.id,
        venue_name="City Arena",
        match_date=now - timedelta(days=6),
        creator_id=user2.id
    )
    
    match12 = Match(
        tournament_id=tournament3.id,
        team1_id=team11.id,
        team2_id=team12.id,
        venue_name="City Arena",
        match_date=now - timedelta(days=3),
        creator_id=user2.id
    )
    
    # Additional upcoming matches
    match13 = Match(
        tournament_id=tournament1.id,
        team1_id=team5.id,
        team2_id=team1.id,
        venue_name="Riverside Court",
        match_date=now + timedelta(days=3),
        creator_id=admin.id
    )
    
    match14 = Match(
        tournament_id=tournament1.id,
        team1_id=team2.id,
        team2_id=team6.id,
        venue_name="Central Stadium",
        match_date=now + timedelta(days=7),
        creator_id=admin.id
    )
    
    match15 = Match(
        tournament_id=tournament2.id,
        team1_id=team7.id,
        team2_id=team3.id,
        venue_name="College Stadium",
        match_date=now + timedelta(days=8),
        creator_id=user1.id
    )
    
    match16 = Match(
        tournament_id=tournament2.id,
        team1_id=team4.id,
        team2_id=team8.id,
        venue_name="University Arena",
        match_date=now + timedelta(days=12),
        creator_id=user1.id
    )
    
    match17 = Match(
        tournament_id=tournament3.id,
        team1_id=team9.id,
        team2_id=team11.id,
        venue_name="City Arena",
        match_date=now + timedelta(days=4),
        creator_id=user2.id
    )
    
    match18 = Match(
        tournament_id=tournament3.id,
        team1_id=team10.id,
        team2_id=team12.id,
        venue_name="City Arena",
        match_date=now + timedelta(days=6),
        creator_id=user2.id
    )
    
    matches = [
        match1, match2, match3, match4, match5, match6, match7, match8, match9, match10,
        match11, match12, match13, match14, match15, match16, match17, match18
    ]
    
    db.session.add_all(matches)
    db.session.commit()
    
    # Add scores for completed matches
    score1 = MatchScore(
        match_id=match1.id,
        team1_score=87,
        team2_score=81
    )
    
    score2 = MatchScore(
        match_id=match2.id,
        team1_score=92,
        team2_score=88
    )
    
    # Add scores for additional completed matches
    score5 = MatchScore(
        match_id=match5.id,
        team1_score=95,
        team2_score=89
    )
    
    score6 = MatchScore(
        match_id=match6.id,
        team1_score=82,
        team2_score=90
    )
    
    score7 = MatchScore(
        match_id=match7.id,
        team1_score=78,
        team2_score=75
    )
    
    score8 = MatchScore(
        match_id=match8.id,
        team1_score=102,
        team2_score=98
    )
    
    score9 = MatchScore(
        match_id=match9.id,
        team1_score=85,
        team2_score=91
    )
    
    score10 = MatchScore(
        match_id=match10.id,
        team1_score=88,
        team2_score=76
    )
    
    score11 = MatchScore(
        match_id=match11.id,
        team1_score=72,
        team2_score=68
    )
    
    score12 = MatchScore(
        match_id=match12.id,
        team1_score=79,
        team2_score=84
    )
    
    scores = [
        score1, score2, score5, score6, score7, score8, 
        score9, score10, score11, score12
    ]
    
    db.session.add_all(scores)
    db.session.commit()
    
    # Update team records based on match results
    # Tournament 1
    team1.wins = 2  # Won matches 1 and 5
    team1.losses = 0
    team1.points = 4
    
    team2.wins = 1  # Won match 6, lost matches 1
    team2.losses = 2
    team2.points = 2
    
    team5.wins = 1  # Won match 7, lost match 5
    team5.losses = 1
    team5.points = 2
    
    team6.wins = 1  # Won match 7, lost match 6
    team6.losses = 1
    team6.points = 2
    
    # Tournament 2
    team3.wins = 2  # Won matches 2 and 8
    team3.losses = 0
    team3.points = 4
    
    team4.wins = 0  # Lost matches 2 and 9
    team4.losses = 2
    team4.points = 0
    
    team7.wins = 1  # Won match 10, lost match 8
    team7.losses = 1
    team7.points = 2
    
    team8.wins = 1  # Won match 9, lost match 10
    team8.losses = 1
    team8.points = 2
    
    # Tournament 3
    team9.wins = 1  # Won match 11
    team9.losses = 0
    team9.points = 2
    
    team10.wins = 0  # Lost match 11
    team10.losses = 1
    team10.points = 0
    
    team11.wins = 0  # Lost match 12
    team11.losses = 1
    team11.points = 0
    
    team12.wins = 1  # Won match 12
    team12.losses = 0
    team12.points = 2
    
    db.session.commit()
    
    # Add player stats for completed matches
    # For match 1, team 1 players
    stats_match1_team1 = [
        PlayerStats(match_id=match1.id, player_id=players_team1[0].id, points=22, rebounds=3, assists=8, steals=2, blocks=0, turnovers=2, three_pointers=4),
        PlayerStats(match_id=match1.id, player_id=players_team1[1].id, points=18, rebounds=5, assists=4, steals=1, blocks=0, turnovers=1, three_pointers=2),
        PlayerStats(match_id=match1.id, player_id=players_team1[2].id, points=15, rebounds=7, assists=3, steals=1, blocks=1, turnovers=2, three_pointers=1),
        PlayerStats(match_id=match1.id, player_id=players_team1[3].id, points=12, rebounds=10, assists=2, steals=0, blocks=2, turnovers=1, three_pointers=0),
        PlayerStats(match_id=match1.id, player_id=players_team1[4].id, points=20, rebounds=12, assists=1, steals=0, blocks=3, turnovers=2, three_pointers=0)
    ]
    
    # For match 1, team 2 players
    stats_match1_team2 = [
        PlayerStats(match_id=match1.id, player_id=players_team2[0].id, points=18, rebounds=4, assists=10, steals=3, blocks=0, turnovers=3, three_pointers=2),
        PlayerStats(match_id=match1.id, player_id=players_team2[1].id, points=16, rebounds=3, assists=5, steals=2, blocks=0, turnovers=1, three_pointers=3),
        PlayerStats(match_id=match1.id, player_id=players_team2[2].id, points=14, rebounds=6, assists=2, steals=1, blocks=1, turnovers=0, three_pointers=2),
        PlayerStats(match_id=match1.id, player_id=players_team2[3].id, points=20, rebounds=8, assists=1, steals=0, blocks=2, turnovers=2, three_pointers=0),
        PlayerStats(match_id=match1.id, player_id=players_team2[4].id, points=13, rebounds=14, assists=2, steals=0, blocks=4, turnovers=2, three_pointers=0)
    ]
    
    # For match 2, team 3 players
    stats_match2_team3 = [
        PlayerStats(match_id=match2.id, player_id=players_team3[0].id, points=24, rebounds=3, assists=12, steals=3, blocks=0, turnovers=2, three_pointers=5),
        PlayerStats(match_id=match2.id, player_id=players_team3[1].id, points=18, rebounds=4, assists=3, steals=2, blocks=0, turnovers=0, three_pointers=4),
        PlayerStats(match_id=match2.id, player_id=players_team3[2].id, points=16, rebounds=7, assists=2, steals=1, blocks=1, turnovers=1, three_pointers=2),
        PlayerStats(match_id=match2.id, player_id=players_team3[3].id, points=14, rebounds=9, assists=1, steals=0, blocks=2, turnovers=1, three_pointers=0),
        PlayerStats(match_id=match2.id, player_id=players_team3[4].id, points=20, rebounds=15, assists=1, steals=0, blocks=4, turnovers=3, three_pointers=0)
    ]
    
    # For match 2, team 4 players
    stats_match2_team4 = [
        PlayerStats(match_id=match2.id, player_id=players_team4[0].id, points=22, rebounds=2, assists=9, steals=2, blocks=0, turnovers=3, three_pointers=4),
        PlayerStats(match_id=match2.id, player_id=players_team4[1].id, points=20, rebounds=5, assists=4, steals=1, blocks=0, turnovers=2, three_pointers=3),
        PlayerStats(match_id=match2.id, player_id=players_team4[2].id, points=16, rebounds=8, assists=3, steals=2, blocks=1, turnovers=1, three_pointers=2),
        PlayerStats(match_id=match2.id, player_id=players_team4[3].id, points=15, rebounds=7, assists=2, steals=1, blocks=3, turnovers=0, three_pointers=1),
        PlayerStats(match_id=match2.id, player_id=players_team4[4].id, points=15, rebounds=13, assists=1, steals=0, blocks=3, turnovers=2, three_pointers=0)
    ]
    
    db.session.add_all(
        stats_match1_team1 + stats_match1_team2 + 
        stats_match2_team3 + stats_match2_team4
    )
    db.session.commit()
    
    print("Seed data successfully created!")

if __name__ == "__main__":
    with app.app_context():
        try:
            create_seed_data()
        except Exception as e:
            print(f"Error creating seed data: {e}")
            sys.exit(1) 