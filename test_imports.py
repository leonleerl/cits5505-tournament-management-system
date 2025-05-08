import sys
import os

print("Python version:", sys.version)
print("Current directory:", os.getcwd())
print("Files in current directory:", os.listdir('.'))
print("Files in app directory:", os.listdir('./app'))
print("Files in app/routes directory:", os.listdir('./app/routes'))

try:
    print("Trying to import database module...")
    from app.models.database import db
    print("Success importing db!")
except Exception as e:
    print(f"Error importing db: {e}")

try:
    print("Trying to import main_routes module...")
    from app.routes.main_routes import main_bp
    print("Success importing main_bp!")
except Exception as e:
    print(f"Error importing main_bp: {e}")

try:
    print("Trying to import auth_routes module...")
    from app.routes.auth_routes import auth_bp
    print("Success importing auth_bp!")
except Exception as e:
    print(f"Error importing auth_bp: {e}")

print("Import test completed.")