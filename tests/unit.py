import unittest
import sys
import os
import importlib.util
from datetime import date, datetime

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load app.py as a module
app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.py')
spec = importlib.util.spec_from_file_location("app_module", app_path)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

from app.models.database import db
from app.models.models import User, Tournament, Team, Player, Match, MatchScore, PlayerStats, TournamentAccess
from config import TestingConfig

unittest.TestLoader.sortTestMethodsUsing = None

class BaseTestCase(unittest.TestCase):
    def setUp(self):
        testApp = app_module.create_app('testing')
        self.app_context = testApp.app_context()
        self.app_context.push()
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

class UserModelUnitTests(BaseTestCase):
    def test_password_hashing(self):
        """Test password hashing functionality"""
        user = User(username='testuser', email='test@example.com', full_name='Test User')
        user.set_password('securepassword')
        self.assertFalse(user.check_password('wrongpassword'))
        self.assertTrue(user.check_password('securepassword'))

    def test_user_creation(self):
        """Test user creation and storage in database"""
        user = User(username='testuser', email='test@example.com', full_name='Test User')
        user.set_password('securepassword')
        db.session.add(user)
        db.session.commit()
        
        # Fetch the user from the database
        fetched_user = User.query.filter_by(username='testuser').first()
        self.assertIsNotNone(fetched_user)
        self.assertEqual(fetched_user.username, 'testuser')
        self.assertEqual(fetched_user.email, 'test@example.com')
        self.assertEqual(fetched_user.full_name, 'Test User')
        
    def test_user_uniqueness(self):
        """Test that users with duplicate usernames or emails can't be created"""
        user1 = User(username='testuser', email='test@example.com', full_name='Test User')
        user1.set_password('password123')
        db.session.add(user1)
        db.session.commit()
        
        # Try to create a user with the same username
        user2 = User(username='testuser', email='different@example.com', full_name='Different User')
        user2.set_password('password123')
        db.session.add(user2)
        
        with self.assertRaises(Exception):
            db.session.commit()
        
        db.session.rollback()
        
        # Try to create a user with the same email
        user3 = User(username='differentuser', email='test@example.com', full_name='Another User')
        user3.set_password('password123')
        db.session.add(user3)
        
        with self.assertRaises(Exception):
            db.session.commit()

class TournamentModelUnitTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # Create a test user for tournament creation
        self.test_user = User(username='tournamentcreator', email='creator@example.com', full_name='Tournament Creator')
        self.test_user.set_password('password123')
        db.session.add(self.test_user)
        db.session.commit()
        
    def test_tournament_creation(self):
        """Test tournament creation and storage"""
        tournament = Tournament(
            name='Test Tournament',
            description='Tournament for testing',
            year=2023,
            start_date=date(2023, 6, 1),
            end_date=date(2023, 6, 15),
            creator_id=self.test_user.id
        )
        db.session.add(tournament)
        db.session.commit()
        
        fetched_tournament = Tournament.query.filter_by(name='Test Tournament').first()
        self.assertIsNotNone(fetched_tournament)
        self.assertEqual(fetched_tournament.description, 'Tournament for testing')
        self.assertEqual(fetched_tournament.year, 2023)
        self.assertEqual(fetched_tournament.creator_id, self.test_user.id)
        
    def test_tournament_access(self):
        """Test tournament access relationships"""
        tournament = Tournament(
            name='Access Tournament',
            description='Tournament for testing access',
            year=2023,
            start_date=date(2023, 7, 1),
            end_date=date(2023, 7, 15),
            creator_id=self.test_user.id
        )
        db.session.add(tournament)
        db.session.commit()
        
        # Create another user to grant access
        another_user = User(username='accessuser', email='access@example.com', full_name='Access User')
        another_user.set_password('password123')
        db.session.add(another_user)
        db.session.commit()
        
        # Grant access to the tournament
        access = TournamentAccess(
            tournament_id=tournament.id,
            user_id=another_user.id
        )
        db.session.add(access)
        db.session.commit()
        
        # Verify access
        self.assertEqual(len(tournament.tournament_access), 1)
        self.assertEqual(tournament.tournament_access[0].user_id, another_user.id)
        self.assertEqual(len(another_user.tournament_access), 1)
        self.assertEqual(another_user.tournament_access[0].tournament_id, tournament.id)

class TeamModelUnitTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # Create a test user
        self.test_user = User(username='teamcreator', email='teamcreator@example.com', full_name='Team Creator')
        self.test_user.set_password('password123')
        db.session.add(self.test_user)
        db.session.commit()
        
        # Create a test tournament
        self.test_tournament = Tournament(
            name='Team Test Tournament',
            description='Tournament for team testing',
            year=2023,
            start_date=date(2023, 8, 1),
            end_date=date(2023, 8, 15),
            creator_id=self.test_user.id
        )
        db.session.add(self.test_tournament)
        db.session.commit()
        
    def test_team_creation(self):
        """Test team creation and attributes"""
        team = Team(
            name='Test Team',
            created_year=2020,
            logo_shape_type=2,
            primary_color='#FF0000',
            secondary_color='#0000FF',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        db.session.add(team)
        db.session.commit()
        
        fetched_team = Team.query.filter_by(name='Test Team').first()
        self.assertIsNotNone(fetched_team)
        self.assertEqual(fetched_team.created_year, 2020)
        self.assertEqual(fetched_team.logo_shape_type, 2)
        self.assertEqual(fetched_team.primary_color, '#FF0000')
        self.assertEqual(fetched_team.secondary_color, '#0000FF')
        self.assertEqual(fetched_team.wins, 0)  # Default value
        self.assertEqual(fetched_team.points, 0)  # Default value
        
    def test_team_tournament_relationship(self):
        """Test relationship between team and tournament"""
        team = Team(
            name='Tournament Team',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        db.session.add(team)
        db.session.commit()
        
        # Test relationship from team to tournament
        self.assertEqual(team.tournament.id, self.test_tournament.id)
        self.assertEqual(team.tournament.name, 'Team Test Tournament')
        
        # Test relationship from tournament to teams
        self.assertEqual(len(self.test_tournament.teams), 1)
        self.assertEqual(self.test_tournament.teams[0].name, 'Tournament Team')

class PlayerModelUnitTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # Create a test user
        self.test_user = User(username='playercreator', email='player@example.com', full_name='Player Creator')
        self.test_user.set_password('password123')
        db.session.add(self.test_user)
        db.session.commit()
        
        # Create a test tournament
        self.test_tournament = Tournament(
            name='Player Test Tournament',
            description='Tournament for player testing',
            year=2023,
            start_date=date(2023, 9, 1),
            end_date=date(2023, 9, 15),
            creator_id=self.test_user.id
        )
        db.session.add(self.test_tournament)
        db.session.commit()
        
        # Create a test team
        self.test_team = Team(
            name='Player Test Team',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        db.session.add(self.test_team)
        db.session.commit()
        
    def test_player_creation(self):
        """Test player creation and attributes"""
        player = Player(
            name='Test Player',
            height=190,
            weight=85,
            position='PG',
            jersey_number=23,
            team_id=self.test_team.id,
            creator_id=self.test_user.id
        )
        db.session.add(player)
        db.session.commit()
        
        fetched_player = Player.query.filter_by(name='Test Player').first()
        self.assertIsNotNone(fetched_player)
        self.assertEqual(fetched_player.height, 190)
        self.assertEqual(fetched_player.weight, 85)
        self.assertEqual(fetched_player.position, 'PG')
        self.assertEqual(fetched_player.jersey_number, 23)
        
    def test_player_team_relationship(self):
        """Test relationship between player and team"""
        player = Player(
            name='Team Player',
            position='SG',
            jersey_number=10,
            team_id=self.test_team.id,
            creator_id=self.test_user.id
        )
        db.session.add(player)
        db.session.commit()
        
        # Test relationship from player to team
        self.assertEqual(player.team.id, self.test_team.id)
        self.assertEqual(player.team.name, 'Player Test Team')
        
        # Test relationship from team to players
        self.assertEqual(len(self.test_team.players), 1)
        self.assertEqual(self.test_team.players[0].name, 'Team Player')

class MatchModelUnitTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # Create a test user
        self.test_user = User(username='matchcreator', email='match@example.com', full_name='Match Creator')
        self.test_user.set_password('password123')
        db.session.add(self.test_user)
        db.session.commit()
        
        # Create a test tournament
        self.test_tournament = Tournament(
            name='Match Test Tournament',
            description='Tournament for match testing',
            year=2023,
            start_date=date(2023, 10, 1),
            end_date=date(2023, 10, 15),
            creator_id=self.test_user.id
        )
        db.session.add(self.test_tournament)
        db.session.commit()
        
        # Create two test teams
        self.team1 = Team(
            name='Team A',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        self.team2 = Team(
            name='Team B',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        db.session.add_all([self.team1, self.team2])
        db.session.commit()
        
    def test_match_creation(self):
        """Test match creation and attributes"""
        match_date = datetime(2023, 10, 5, 18, 0, 0)
        match = Match(
            tournament_id=self.test_tournament.id,
            team1_id=self.team1.id,
            team2_id=self.team2.id,
            venue_name='Test Arena',
            match_date=match_date,
            creator_id=self.test_user.id
        )
        db.session.add(match)
        db.session.commit()
        
        fetched_match = Match.query.filter_by(venue_name='Test Arena').first()
        self.assertIsNotNone(fetched_match)
        self.assertEqual(fetched_match.tournament_id, self.test_tournament.id)
        self.assertEqual(fetched_match.team1_id, self.team1.id)
        self.assertEqual(fetched_match.team2_id, self.team2.id)
        self.assertEqual(fetched_match.match_date, match_date)
        
    def test_match_score(self):
        """Test match score relationship"""
        match = Match(
            tournament_id=self.test_tournament.id,
            team1_id=self.team1.id,
            team2_id=self.team2.id,
            venue_name='Score Test Arena',
            match_date=datetime(2023, 10, 6, 18, 0, 0),
            creator_id=self.test_user.id
        )
        db.session.add(match)
        db.session.commit()
        
        # Add score for the match
        score = MatchScore(
            match_id=match.id,
            team1_score=105,
            team2_score=98
        )
        db.session.add(score)
        db.session.commit()
        
        # Test relationship from match to score
        self.assertIsNotNone(match.score)
        self.assertEqual(match.score.team1_score, 105)
        self.assertEqual(match.score.team2_score, 98)
        
        # Test relationship from score to match
        self.assertEqual(score.match.venue_name, 'Score Test Arena')

class PlayerStatsUnitTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # Create a test user
        self.test_user = User(username='statscreator', email='stats@example.com', full_name='Stats Creator')
        self.test_user.set_password('password123')
        db.session.add(self.test_user)
        db.session.commit()
        
        # Create a test tournament
        self.test_tournament = Tournament(
            name='Stats Test Tournament',
            description='Tournament for stats testing',
            year=2023,
            start_date=date(2023, 10, 1),
            end_date=date(2023, 10, 15),
            creator_id=self.test_user.id
        )
        db.session.add(self.test_tournament)
        db.session.commit()
        
        # Create test teams
        self.test_team1 = Team(
            name='Stats Team 1',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        self.test_team2 = Team(
            name='Stats Team 2',
            creator_id=self.test_user.id,
            tournament_id=self.test_tournament.id
        )
        db.session.add_all([self.test_team1, self.test_team2])
        db.session.commit()
        
        # Create a test player
        self.test_player = Player(
            name='Stats Player',
            position='PG',
            jersey_number=1,
            team_id=self.test_team1.id,
            creator_id=self.test_user.id
        )
        db.session.add(self.test_player)
        db.session.commit()
        
        # Create a test match
        self.test_match = Match(
            tournament_id=self.test_tournament.id,
            team1_id=self.test_team1.id,
            team2_id=self.test_team2.id,
            match_date=datetime(2023, 10, 5, 14, 0),
            creator_id=self.test_user.id
        )
        db.session.add(self.test_match)
        db.session.commit()
        
    def test_player_stats_creation(self):
        """Test player stats creation and attributes"""
        stats = PlayerStats(
            match_id=self.test_match.id,
            player_id=self.test_player.id,
            points=25,
            rebounds=10,
            assists=5,
            steals=2,
            blocks=1,
            turnovers=3,
            three_pointers=4
        )
        db.session.add(stats)
        db.session.commit()
        
        fetched_stats = PlayerStats.query.filter_by(player_id=self.test_player.id).first()
        self.assertIsNotNone(fetched_stats)
        self.assertEqual(fetched_stats.points, 25)
        self.assertEqual(fetched_stats.rebounds, 10)
        self.assertEqual(fetched_stats.assists, 5)
        self.assertEqual(fetched_stats.steals, 2)
        self.assertEqual(fetched_stats.blocks, 1)
        self.assertEqual(fetched_stats.turnovers, 3)
        self.assertEqual(fetched_stats.three_pointers, 4)
        
    def test_calculated_fields(self):
        """Test calculated fields in player stats"""
        stats = PlayerStats(
            match_id=self.test_match.id,
            player_id=self.test_player.id,
            points=25,
            rebounds=12,
            assists=10,
            steals=2,
            blocks=1,
            turnovers=3,
            three_pointers=4
        )
        db.session.add(stats)
        db.session.commit()
        
        # Test efficiency calculation
        expected_efficiency = 25 + 12 + 10 + 2 + 1 - 3  # points + rebounds + assists + steals + blocks - turnovers
        self.assertEqual(stats.efficiency, expected_efficiency)
        
        # Test double_double (points and rebounds >= 10)
        self.assertTrue(stats.double_double)
        
        # Test triple_double (points, rebounds, and assists >= 10)
        self.assertTrue(stats.triple_double)

if __name__ == '__main__':
    unittest.main() 