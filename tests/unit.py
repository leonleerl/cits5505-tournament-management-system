import unittest
import sys
import os
import importlib.util

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Load app.py as a module
app_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'app.py')
spec = importlib.util.spec_from_file_location("app_module", app_path)
app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(app_module)

from app.models.database import db
from app.models.models import User
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

if __name__ == '__main__':
    unittest.main(verbosity=1) 