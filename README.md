# Basketball Tournament Management System - Flask Migration

This project is a Flask implementation of the Basketball Tournament Management System, with Jinja2 templates and SQLAlchemy for database access.

## Project Structure

```
app/
├── models/           # Database models
│   ├── __init__.py
│   ├── database.py   # SQLAlchemy setup
│   └── models.py     # ORM models for all tables
├── routes/           # Route definitions
│   ├── __init__.py
│   └── main_routes.py # Main routes for index page
├── static/           # Static assets
│   ├── css/          # CSS files
│   │   └── index.css
│   └── js/           # JavaScript files
│       └── index.js
├── templates/        # Jinja2 templates
│   └── index.html    # Main index template
└── __init__.py
app.py                # Main application entry point
cits5505.db           # SQLite database
requirements.txt      # Project dependencies
```

## Setup Instructions

### Setting up a Virtual Environment

1. Clone the repository:

   ```
   git clone <repository-url>
   cd cits5505-tournament-management-system
   ```

2. Create a Python virtual environment:

   ```
   python -m venv venv
   ```

3. Activate the virtual environment:

   For Windows:

   ```
   venv\Scripts\activate
   ```

   For macOS/Linux:

   ```
   source venv/bin/activate
   ```

4. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

### Running the Application

1. Make sure your virtual environment is activated (see step 3 above)

2. Run the Flask application:

   ```
   python app.py
   ```

3. Open your browser and navigate to http://127.0.0.1:5000

### Deactivating the Virtual Environment

When you're done working on the project, you can deactivate the virtual environment:

## Features

- Server-side rendering with Jinja2 templates
- Dynamic data loading from SQLite database
- Season filtering for matches
- Leaderboard with team statistics
- Upcoming matches display
- Recent match results with scores

## Implementation Notes

- Only the `index.html` page has been migrated to Flask
- All CSS styles have been preserved from the original project
- JavaScript functionality has been simplified to work with server-side rendering
- Database interactions use SQLAlchemy to connect to the existing `cits5505.db` file
