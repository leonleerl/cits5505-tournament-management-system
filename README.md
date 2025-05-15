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

- **ER Diagram**:



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
├── db/                 # Database
app.py                  # Entry point
requirements.txt        # Dependencies
config.py               # Configurations
tests/                  # Unit + Selenium tests
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

### Deactivating the Virtual Environment

When you're done working on the project, you can deactivate the virtual environment.
