# recreate_db.py
import os
import sqlite3

# Remove existing database file if it exists
db_paths = ['cits5505.db', './db/cits5505.db']
for db_path in db_paths:
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"Removed existing database: {db_path}")

# Create a new empty database file
for db_path in db_paths:
    conn = sqlite3.connect(db_path)
    conn.close()
    print(f"Created empty database: {db_path}")

print("\nNow run your Flask app to initialize the database schema:")
print("python app.py")