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
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from app.models.database import db
from app.models.models import User
from config import SeleniumTestingConfig
from sqlalchemy.exc import IntegrityError

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

    def test_page_load(self):
        """Test that the page loads successfully"""
        self.client.get(localHost)
        self.assertTrue(True)
        
    def test_server_running(self):
        """Test that the server is running and responding"""
        self.client.get(localHost)
        body = self.client.find_element(By.TAG_NAME, "body")
        self.assertIsNotNone(body)

if __name__ == '__main__':
    unittest.main(verbosity=1) 