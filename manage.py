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
from flask_migrate import Migrate, init, migrate, upgrade
migrate_obj = Migrate(app, db)
 
def print_usage():
    print("\nUsage:")
    print("  python db_migrate.py init          - Initialize migrations")
    print("  python db_migrate.py migrate       - Create migration script")
    print("  python db_migrate.py upgrade       - Apply migrations")
    print("  python db_migrate.py all           - Do all three steps\n")
 
if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "usage"
    message = "Update database schema"
    with app.app_context():
        try:
            if command == "init":
                print("Initializing migrations...")
                init(directory="migrations")
                print("✅ Migrations initialized!")
            elif command == "migrate":
                print("Creating migration script...")
                migrate(directory="migrations", message=message)
                print("✅ Migration script created!")
            elif command == "upgrade":
                print("Applying migrations...")
                upgrade(directory="migrations")
                print("✅ Database upgraded!")
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