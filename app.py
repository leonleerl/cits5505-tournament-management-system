import os
import atexit
import shutil
from flask import Flask, g
from datetime import datetime
from flask_wtf.csrf import CSRFProtect
from app.models.database import db
from app.routes.main_routes import main_bp
from app.routes.auth_routes import auth_bp
import subprocess
from flask_login import LoginManager

# Function to clean up __pycache__ directories
def cleanup_pycache():
    print("Cleaning up __pycache__ directories...")
    try:
        for root, dirs, files in os.walk('.'):
            for dir in dirs:
                if dir == '__pycache__':
                    pycache_path = os.path.join(root, dir)
                    print(f"Removing {pycache_path}")
                    shutil.rmtree(pycache_path)
        print("__pycache__ cleanup completed successfully")
    except Exception as e:
        print(f"Error during __pycache__ cleanup: {e}")

# Register the cleanup function to run at exit
atexit.register(cleanup_pycache)

print("Starting application...")
# Initialize CSRF protection
csrf = CSRFProtect()
# Create and configure the app
print("Creating Flask app...")
app = Flask(__name__,
            template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'templates'),
            static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'static'))
# Set up configurations
print("Setting up configurations...")
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY') or 'default-dev-key-change-in-production'
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.abspath("db/cits5505.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# Initialize extensions
print("Initializing extensions...")
db.init_app(app)
csrf.init_app(app)
  # 🔧 Temporary fix for packages expecting this attribute
# Register blueprints
print("Importing blueprints...")
app.register_blueprint(main_bp)
app.register_blueprint(auth_bp)
# Create a dummy current_user object for templates
class DummyUser:
    is_authenticated = False
@app.context_processor
def inject_globals():
    return {
        'current_user': DummyUser(),
        'current_year': datetime.now().year  # Add current year directly
    }
# Create database tables if they don't exist
print("Creating database tables...")
with app.app_context():
    try:
        db.create_all()
        print("Database tables created successfully")
       
        # Check if the database is empty (no users)
        from app.models.models import User
        user_count = User.query.count()
       
        if user_count == 0:
            print("Database is empty. Running seed data script...")
            try:
                # Import and run seed data function directly
                from seed_db import create_seed_data
                create_seed_data()
                print("Seed data created successfully!")
            except Exception as e:
                print(f"Error creating seed data: {e}")
    except Exception as e:
        print(f"Error creating database tables: {e}")
from app.models.models import User
login_manager = LoginManager()
login_manager.login_view = 'auth.login'  # Where to redirect on @login_required
login_manager.init_app(app)
app.login_manager = login_manager
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))
print("Setting up app.run()...")
if __name__ == '__main__':
    # Enable watchdog reloader
    print("Starting Flask server...")
    app.run(debug=True, use_reloader=True)
    print("Server has stopped.")