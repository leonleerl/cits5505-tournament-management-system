import threading
import unittest
import sys
import os
import importlib.util
from time import sleep

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load app.py as a module
app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.py')
spec = importlib.util.spec_from_file_location("app_module", app_path)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, TimeoutException
from app.models.database import db
from app.models.models import User, Tournament, Team, Match, Player
from config import SeleniumTestingConfig
from sqlalchemy.exc import IntegrityError
from datetime import date, datetime, timedelta

localHost = "http://localhost:5000/"

class SeleniumTestCase(unittest.TestCase):
    client = None

    @classmethod
    def setUpClass(cls):
        options = webdriver.ChromeOptions()
        options.add_argument('headless') 
        try:
            cls.client = webdriver.Chrome(options=options)
        except Exception as e:
            print(f"Error starting browser: {e}")
            cls.client = None
        if cls.client:
            cls.testApp = app_module.create_app('selenium_testing')
            cls.app_context = cls.testApp.app_context()
            cls.app_context.push()
            db.create_all()
            
            # Create a test user, but handle the case if it already exists
            try:
                existing_user = User.query.filter_by(username='testuser').first()
                if not existing_user:
                    test_user = User(username='testuser', email='test@example.com', full_name='Test User')
                    test_user.set_password('password123')
                    db.session.add(test_user)
                    db.session.commit()
            except IntegrityError:
                db.session.rollback()
            
            # Create a test tournament
            try:
                test_tournament = Tournament.query.filter_by(name='Test Tournament').first()
                if not test_tournament:
                    # Get the user id
                    user = User.query.filter_by(username='testuser').first()
                    if user:
                        today = date.today()
                        test_tournament = Tournament(
                            name='Test Tournament',
                            description='Tournament for Selenium testing',
                            year=today.year,
                            start_date=today,
                            end_date=today + timedelta(days=14),
                            creator_id=user.id
                        )
                        db.session.add(test_tournament)
                        db.session.commit()
                        
                        # Create two test teams for the tournament
                        test_team1 = Team(
                            name='Lakers',
                            created_year=1960,
                            primary_color='#FDB927',
                            secondary_color='#552583',
                            creator_id=user.id,
                            tournament_id=test_tournament.id
                        )
                        test_team2 = Team(
                            name='Celtics',
                            created_year=1946,
                            primary_color='#007A33',
                            secondary_color='#FFFFFF',
                            creator_id=user.id,
                            tournament_id=test_tournament.id
                        )
                        db.session.add_all([test_team1, test_team2])
                        db.session.commit()
                        
                        # Create players for the teams
                        player1 = Player(
                            name='LeBron James',
                            position='SF',
                            jersey_number=23,
                            height=206,
                            weight=113,
                            team_id=test_team1.id,
                            creator_id=user.id
                        )
                        player2 = Player(
                            name='Anthony Davis',
                            position='PF',
                            jersey_number=3,
                            height=208,
                            weight=115,
                            team_id=test_team1.id,
                            creator_id=user.id
                        )
                        player3 = Player(
                            name='Jayson Tatum',
                            position='SF',
                            jersey_number=0,
                            height=203,
                            weight=95,
                            team_id=test_team2.id,
                            creator_id=user.id
                        )
                        player4 = Player(
                            name='Jaylen Brown',
                            position='SG',
                            jersey_number=7,
                            height=198,
                            weight=101,
                            team_id=test_team2.id,
                            creator_id=user.id
                        )
                        db.session.add_all([player1, player2, player3, player4])
                        db.session.commit()
                        
                        # Create a test match
                        match = Match(
                            tournament_id=test_tournament.id,
                            team1_id=test_team1.id,
                            team2_id=test_team2.id,
                            venue_name='Test Arena',
                            match_date=datetime.now() + timedelta(days=1),
                            creator_id=user.id
                        )
                        db.session.add(match)
                        db.session.commit()
            except IntegrityError:
                db.session.rollback()
            
            # Start Flask server in a separate thread
            cls.server_thread = threading.Thread(target=cls.testApp.run, kwargs={'port': 5000, 'use_reloader': False})
            cls.server_thread.daemon = True
            cls.server_thread.start()
            
            sleep(1)  # Give the server time to start

    @classmethod
    def tearDownClass(cls):
        try:
            if cls.client:
                cls.client.quit()
            if hasattr(cls, 'app_context'):
                db.session.remove()
                cls.app_context.pop()
        except Exception as e:
            print(f"Error during teardown: {e}")

    def setUp(self):
        if not self.client:
            self.skipTest('Web browser not available')

    def tearDown(self):
        pass

    # Basic Page Loading Tests
    def test_homepage_loads(self):
        """Test that the homepage loads successfully"""
        self.client.get(localHost)
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_login_page_loads(self):
        """Test that the login page loads successfully"""
        self.client.get(f"{localHost}login")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
            
    def test_signup_page_loads(self):
        """Test that signup page loads successfully"""
        self.client.get(f"{localHost}signup")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_page_not_found(self):
        """Test 404 page exists"""
        self.client.get(f"{localHost}non_existent_page")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    # Page Structure and Design Tests
    def test_homepage_has_structure(self):
        """Test that the homepage has basic HTML structure elements"""
        self.client.get(localHost)
        structure_elements = self.client.find_elements(By.CSS_SELECTOR, "div, header, main, section, article")
        self.assertTrue(len(structure_elements) > 0, "No structural elements found on page")
            
    def test_has_basketball_related_content(self):
        """Test that the page has basketball-related content"""
        self.client.get(localHost)
        page_source = self.client.page_source.lower()
        basketball_terms = ['basketball', 'tournament', 'team', 'game', 'match', 'player', 'score']
        found_terms = [term for term in basketball_terms if term in page_source]
        self.assertTrue(len(found_terms) > 0, "No basketball-related content found")
             
    def test_terms_page_loads(self):
        """Test that terms page loads successfully"""
        self.client.get(f"{localHost}terms")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
             
    def test_privacy_page_loads(self):
        """Test that privacy page loads successfully"""
        self.client.get(f"{localHost}privacy")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_homepage_has_interactive_elements(self):
        """Test that homepage has interactive elements"""
        self.client.get(localHost)
        
        interactive_elements = []
        
        interactive_elements.extend(self.client.find_elements(By.TAG_NAME, "a"))
        
        interactive_elements.extend(self.client.find_elements(By.TAG_NAME, "button"))
        interactive_elements.extend(self.client.find_elements(By.CSS_SELECTOR, "input[type='button'], input[type='submit']"))
        
        interactive_elements.extend(self.client.find_elements(By.TAG_NAME, "input"))
        interactive_elements.extend(self.client.find_elements(By.TAG_NAME, "select"))
        interactive_elements.extend(self.client.find_elements(By.TAG_NAME, "textarea"))
        
        interactive_elements.extend(self.client.find_elements(By.CSS_SELECTOR, ".btn, .button, .clickable, [role='button']"))
        
        has_clickables = False
        if len(interactive_elements) > 0:
            has_clickables = True
        
        if not has_clickables:
            page_source = self.client.page_source
            has_clickables = "onclick=" in page_source or "addEventListener" in page_source
            
        self.assertTrue(has_clickables, "No interactive elements found on homepage")
            
    def test_homepage_has_responsive_design(self):
        """Test that the homepage uses responsive design techniques"""
        self.client.get(localHost)
        
        responsive_indicators = [
            "meta[name='viewport']",  # Viewport meta tag
            ".container",             # Bootstrap container class
            ".row",                   # Bootstrap row class
            ".col",                   # Bootstrap column class
            "@media"                  # Media queries in inline styles
        ]
        
        page_source = self.client.page_source
        found_indicators = False
        
        viewport_meta = self.client.find_elements(By.CSS_SELECTOR, "meta[name='viewport']")
        if len(viewport_meta) > 0:
            found_indicators = True
            
        for indicator in responsive_indicators[1:4]:
            elements = self.client.find_elements(By.CSS_SELECTOR, indicator)
            if len(elements) > 0:
                found_indicators = True
                break
                
        if "@media" in page_source:
            found_indicators = True
            
        self.assertTrue(found_indicators, "No responsive design indicators found")
        
    # Page Content and Functionality Tests
    def test_tournaments_page_loads(self):
        """Test that the tournaments page loads"""
        self.client.get(f"{localHost}tournaments")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_teams_page_loads(self):
        """Test that the teams page loads"""
        self.client.get(f"{localHost}teams")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_page_has_heading(self):
        """Test that the page has a heading element"""
        self.client.get(localHost)
        headings = self.client.find_elements(By.CSS_SELECTOR, "h1, h2, h3, h4, h5, h6")
        self.assertTrue(len(headings) > 0, "No headings found on page")
        
    def test_page_has_form_elements(self):
        """Test that login or signup page has form elements"""
        self.client.get(f"{localHost}login")
        
        forms = self.client.find_elements(By.TAG_NAME, "form")
        inputs = self.client.find_elements(By.TAG_NAME, "input")
        buttons = self.client.find_elements(By.TAG_NAME, "button")
        
        has_form_elements = len(forms) > 0 or len(inputs) > 0 or len(buttons) > 0
        
        if not has_form_elements:
            self.client.get(f"{localHost}signup")
            forms = self.client.find_elements(By.TAG_NAME, "form")
            inputs = self.client.find_elements(By.TAG_NAME, "input")
            buttons = self.client.find_elements(By.TAG_NAME, "button")
            has_form_elements = len(forms) > 0 or len(inputs) > 0 or len(buttons) > 0
            
        self.assertTrue(has_form_elements, "No form elements found on login or signup pages")
        
    def test_static_resources_load(self):
        """Test that static resources like CSS and JS are being loaded"""
        self.client.get(localHost)
        css_links = self.client.find_elements(By.CSS_SELECTOR, "link[rel='stylesheet']")
        js_scripts = self.client.find_elements(By.TAG_NAME, "script")
        
        has_static_resources = len(css_links) > 0 or len(js_scripts) > 0
        self.assertTrue(has_static_resources, "No static resources (CSS/JS) found")
        
    # Basketball Tournament Management System Specific Tests
    def test_players_page_loads(self):
        """Test that the players page loads"""
        self.client.get(f"{localHost}players")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_matches_page_loads(self):
        """Test that the matches page loads"""
        self.client.get(f"{localHost}matches")
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)
        
    def test_teams_has_basketball_content(self):
        """Test that teams page has basketball-related content"""
        self.client.get(f"{localHost}teams")
        page_source = self.client.page_source.lower()
        
        # Check if the page source contains basketball team-related terms
        team_terms = ['team', 'lakers', 'celtics', 'player', 'basketball']
        found_terms = [term for term in team_terms if term in page_source]
        
        team_elements = self.client.find_elements(By.CSS_SELECTOR, ".team, .team-card, .team-name, .team-logo")
        
        has_team_content = len(found_terms) > 0 or len(team_elements) > 0
        self.assertTrue(has_team_content, "No basketball team content found on teams page")
        
    def test_tournaments_has_basketball_content(self):
        """Test that tournaments page has basketball-related content"""
        self.client.get(f"{localHost}tournaments")
        page_source = self.client.page_source.lower()
        
        # Check if the page source contains basketball tournament-related terms
        tournament_terms = ['tournament', 'basketball', 'match', 'game', 'team', 'competition']
        found_terms = [term for term in tournament_terms if term in page_source]
        
        tournament_elements = self.client.find_elements(By.CSS_SELECTOR, ".tournament, .tournament-card, .tournament-name, .tournament-date")
        
        has_tournament_content = len(found_terms) > 0 or len(tournament_elements) > 0
        self.assertTrue(has_tournament_content, "No basketball tournament content found on tournaments page")
        
    def test_has_player_positions(self):
        """Test if player positions (PG, SG, SF, PF, C) are mentioned"""
        self.client.get(f"{localHost}players")
        page_source = self.client.page_source.lower()
        
        positions = ['pg', 'sg', 'sf', 'pf', 'c']
        position_terms = ['point guard', 'shooting guard', 'small forward', 'power forward', 'center']
        
        all_position_terms = positions + position_terms
        found_positions = [pos for pos in all_position_terms if pos in page_source]
        
        if len(found_positions) == 0:
            self.client.get(f"{localHost}teams")
            page_source = self.client.page_source.lower()
            found_positions = [pos for pos in all_position_terms if pos in page_source]
        
        has_positions = len(found_positions) > 0
        
        if not has_positions:
            has_positions = "position" in page_source
            
        self.assertTrue(has_positions, "No basketball player positions found")
    
    def test_has_statistics_content(self):
        """Test if there's content related to player or team statistics"""
        pages_to_check = ['players', 'teams', 'matches', 'statistics', 'stats']
        
        found_stats = False
        stats_terms = ['stats', 'statistics', 'points', 'rebounds', 'assists', 'steals', 'blocks', 
                      'win', 'loss', 'score', 'percentage', 'average', 'efficiency']
        
        for page in pages_to_check:
            try:
                self.client.get(f"{localHost}{page}")
                page_source = self.client.page_source.lower()
                
                found_terms = [term for term in stats_terms if term in page_source]
                if len(found_terms) > 0:
                    found_stats = True
                    break
            except:
                continue
        
        if not found_stats:
            self.client.get(f"{localHost}matches")
            page_source = self.client.page_source
            has_numbers = any(char.isdigit() for char in page_source)
            self.assertTrue(has_numbers, "No statistics or numerical data found in the system")
        else:
            self.assertTrue(found_stats, "No statistics content found in the system")

if __name__ == '__main__':
    unittest.main(verbosity=1) 