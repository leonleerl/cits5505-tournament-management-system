import os
from flask import Flask
from app.models.database import db
from app.routes.main_routes import main_bp

# Create and configure the app
app = Flask(__name__, 
            template_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'templates'),
            static_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app', 'static'))

# Configure database - use absolute path to avoid any path issues
db_path = os.path.abspath('cits5505.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize database
db.init_app(app)

# Register blueprints
app.register_blueprint(main_bp)

if __name__ == '__main__':
    app.run(debug=True) 