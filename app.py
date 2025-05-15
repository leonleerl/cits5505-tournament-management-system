import os
import atexit
import shutil
from flask import Flask
from datetime import datetime
from flask_wtf.csrf import CSRFProtect
from app.models.database import db
from app.routes.main_routes import main_bp
from app.routes.auth_routes import auth_bp
from flask_login import LoginManager
from flask_migrate import Migrate
import subprocess
from config import config

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

# Initialize CSRF protection
csrf = CSRFProtect()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'  # Where to redirect on @login_required

def create_app(config_name='default'):
    """
    Application factory function that creates and configures the Flask app
    
    Args:
        config_name (str): The configuration to use - 'development', 'testing', 'production' or 'default'
        
    Returns:
        Flask: The configured Flask application instance
    """
    print("Starting application...")
    # Create and configure the app
    print(f"Creating Flask app with {config_name} configuration...")
    app = Flask(__name__,
                template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'templates'),
                static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'static'))
    
    # Set up configurations
    print("Setting up configurations...")
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    print("Initializing extensions...")
    db.init_app(app)
    csrf.init_app(app)
    
    # Initialize Flask-Migrate
    migrate = Migrate(app, db)
    
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
    
    # Initialize login manager
    login_manager.init_app(app)
    app.login_manager = login_manager
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.models.models import User
        return User.query.get(int(user_id))
    
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
    
    return app

# Create the application instance - uses 'default' configuration by default
# To use a different configuration, set the FLASK_CONFIG environment variable
# e.g., FLASK_CONFIG=production python app.py
app = create_app(os.environ.get('FLASK_CONFIG') or 'default')

if __name__ == '__main__':
    app.run(debug=app.config['DEBUG'], use_reloader=app.config['USE_RELOADER'])
