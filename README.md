# CITS5505 Project : 🏀 Fantasy Basketball

## 🎯 Description

**Fantasy Basketball** is a web-based platform designed to simplify basketball tournament management for coaches, players, and fans. It allows users to upload tournament data via Excel files, manage teams and matches, visualize performance statistics, and securely share access with others. Built using Flask and SQLAlchemy, the app provides an intuitive interface and powerful analytics for both casual and competitive leagues.

## Group members
| UWA ID | Name | GitHub Username |
|:--------:|:------------:|:-----------:|
| 24032869 | Amit Bhudiya | amitbhudiya |
| 21211711 | Asad Maza    | asadmaza    |
| 24169259 | Leon Li      | leonleerl   |

## 📘 Table of Contents

- [Description](#-description)
- [Features](#-features)
- [Pages and Views](#-pages-and-views)
- [Design and Development](#-design-and-development)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture-mvc)
- [Data Management](#-data-management)
- [Testing and Quality Assurance](#-testing-and-quality-assurance)
- [Security](#-security)
- [Project Structure](project-structure)
- [Setup Instruction](#setup-instructions)

## 🚀 Features

- ✅ User Authentication (Signup/Login/Logout)
- 📊 Tournament Upload via Excel with live validation
- 🏆 Visualise tournaments with charts and statistics
- 🤝 Share tournaments with other users
- 📂 Manage teams, players, matches, and statistics
- 🔒 Role-based access control for shared data
- 🧠 Intelligent leaderboard and win/loss summaries

## 🖥 Pages and Views

#### 1. `/` 
- Displays leaderboard, upcoming matches, and recent results

#### 2. `/login` and `/signup`
- Forms for user authentication with server-side validation

#### 3. `/upload`
- Authenticated upload of Excel files with tournament data 
- Data validated and processed using pandas

#### 4. `/share`
- Share access to tournaments with other registered users

#### 5. `/visualise`
- Graphs, charts, and filters for data insights

## 🎨 Design and Development

- **Concept**: Empower users to simulate real basketball operations
- **Design Principles**: Clarity, accessibility, responsiveness
- **UX/UI**: Built using Bootstrap 5 and custom components
- **Animations**: Floating icons, glow effects, interactive charts

## 🛠 Technology Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Login
- **Frontend**: HTML5, Bootstrap, JavaScript, FontAwesome
- **Database**: SQLite (test), SQLAlchemy ORM
- **Testing**: `pytest`, `unittest`, `selenium`

## 🏗 Architecture (MVC)

- **Models**: Users, Tournaments, Teams, Matches, Stats
- **Views**: Jinja2 templates under `/templates`
- **Controllers**: Flask blueprints in `auth_routes.py`, `main_routes.py`

## 📊 Data Management

#### Database Configuration

- `SQLAlchemy ORM:` Integrated with Flask-SQLAlchemy for object-relational mapping
- `Connection Management:` Connection pooling configured to optimize database resources
- `Migration Support:` Flask-Migrate (Alembic) integrated for schema version control

#### Data Models

- Models defined in `models.py` with relationships and constraints
- Each model includes proper validation rules
- Database indexes created on frequently queried columns



## ✅ Testing and Quality Assurance

- **Unit Tests**: Using `pytest` for core logic
- **E2E Tests**: `selenium.py` runs browser automation
  - Test login/signup page load
  - Protected page redirects (`/upload`, `/visualise`)
- **Test Database**:
  - Uses `SeleniumTestingConfig` with `sqlite:///testapp.db`
  - `db.create_all()` initializes schema
  
## 🔐 Security
- Passwords hashed with Werkzeug
- CSRF protection on all forms via `Flask-WTF`
- Flask-Login manages session-based authentication
- Role-limited access (only tournament owners can share)

## Project Structure

```
app/
├── models/             # Database models
│   ├── database.py     # SQLAlchemy setup
│   └── models.py       # ORM models for Users, Teams, Matches, etc.
├── routes/             # Route definitions
│   ├── auth_routes.py  # Authentication routes (login/signup/logout)
│   └── main_routes.py  # Main app routes
├── static/             # CSS, JS, images
│   ├── css/
│   └── js/
├── templates/          # Jinja2 HTML templates
│   ├── index.html
│   ├── login.html
│   ├── signup.html
│   └── ...
├── forms/              # WTForms for all user inputs
├── db/cits5505.db      # Database
app.py                  # Entry point
requirements.txt        # Dependencies
config.py               # Configurations
tests/                  # Unit + Selenium tests
migration/              # flask-db-migration
```

## 🚀 Setup Instructions

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

## 🧪 Run tests

To run tests for the application, follow these steps to run tests.

### 1. Unittest

**Install Unittest**

`unittest` is a built-in Python module used for writing and running tests. It is included with Python, but if for some reason it is not installed, you can install it via pip:
```
pip install unittest
```

**Running Unittest**

Open activate your virtual environment, then use the following command to run your unittests in your root folder:
```
python -m tests.unit
```

### 2. Selenium Testing

**Install Selenium**

Make sure you have Selenium installed:
```
pip install selenium
```

**Running Selenium Tests**


Open your virtual enviournment and run this command in your root folder
```
python -m tests.selenium
```
This will  perform the actions defined in the `selenium.py`

Test results will be displayed in the terminal window.

# Flask Database Migrations

## Overview

This document outlines the database migration commands available in our Flask application. Database migrations allow you to make changes to your database schema over time while preserving existing data.

## Migration Commands

### Basic Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `init` | Initialize the migrations directory structure | `python manage.py init` |
| `migrate` | Generate a new migration script based on model changes | `python manage.py migrate` |
| `upgrade` | Apply pending migrations to the database | `python manage.py upgrade` |
| `downgrade` | Revert the most recent migration | `python manage.py downgrade` |
| `all` | Run init, migrate, and upgrade in sequence | `python manage.py all` |

### Information Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `history` | Display migration version history | `python manage.py history` |
| `current` | Show the current migration version | `python manage.py current` |

### Advanced Usage

| Command | Description | Usage |
|---------|-------------|-------|
| `message` | Create migration with custom message | `python manage.py message "Add user table"` |

## Workflow Examples

### First-time Setup

```bash
# Initialize migration repository and create first migration
python manage.py init
python manage.py migrate
python manage.py upgrade
```

### Making Schema Changes

```bash
# After modifying models.py:
python manage.py migrate
python manage.py upgrade
```

### Rolling Back Changes

```bash
# If you need to revert the last migration:
python manage.py downgrade
```

## Implementation Details

Our migration system uses a custom `manage.py` script that:

1. Loads the Flask application using the factory pattern
2. Initializes Flask-Migrate with our SQLAlchemy database
3. Provides command-line interface for all migration operations


## Environment Configuration

The migration system uses the database URI configured in your Flask application. Make sure your database connection is properly configured in your environment via `FLASK_CONFIG` or it will default to the 'default' configuration.

### Deactivating the Virtual Environment

When you're done working on the project, you can deactivate the virtual environment.
