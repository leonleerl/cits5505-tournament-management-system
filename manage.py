import os
import sys
from importlib.machinery import SourceFileLoader
 
# Load app.py directly as a module
app_module = SourceFileLoader("app_module", 
                            os.path.join(os.path.dirname(__file__), "app.py")).load_module()
 
# Get the create_app function
create_app = app_module.create_app
 
# Import database
from app.models.database import db
 
# Create the app
app = create_app(os.environ.get('FLASK_CONFIG') or 'default')
 
# Initialize migrations
from flask_migrate import Migrate, init, migrate, upgrade, downgrade, history, current
migrate_obj = Migrate(app, db)
 
def print_usage():
    print("\nUsage:")
    print("  python manage.py init          - Initialize migrations")
    print("  python manage.py migrate       - Create migration script")
    print("  python manage.py upgrade       - Apply migrations")
    print("  python manage.py downgrade     - Revert to previous migration")
    print("  python manage.py history       - Show migration history")
    print("  python manage.py current       - Show current migration")
    print("  python manage.py all           - Run init, migrate, and upgrade")
    print("  python manage.py message \"Your message\" - Create migration with custom message\n")
 
if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "usage"
    
    # Get custom message if provided
    message = "Update database schema"
    if command == "message" and len(sys.argv) > 2:
        message = sys.argv[2]
        command = "migrate"
    
    with app.app_context():
        try:
            if command == "init":
                print("Initializing migrations...")
                init(directory="migrations")
                print("✅ Migrations initialized!")
            elif command == "migrate":
                print(f"Creating migration script with message: '{message}'...")
                migrate(directory="migrations", message=message)
                print("✅ Migration script created!")
            elif command == "upgrade":
                print("Applying migrations...")
                upgrade(directory="migrations")
                print("✅ Database upgraded!")
            elif command == "downgrade":
                print("Reverting to previous migration...")
                downgrade(directory="migrations")
                print("✅ Database downgraded!")
            elif command == "history":
                print("Migration history:")
                history(directory="migrations")
            elif command == "current":
                print("Current migration:")
                current(directory="migrations")
            elif command == "all":
                print("Running all migration steps...")
                init(directory="migrations")
                migrate(directory="migrations", message=message)
                upgrade(directory="migrations")
                print("✅ All migration steps completed!")
            else:
                print_usage()
        except Exception as e:
            print(f"❌ Error: {e}")
            print_usage()