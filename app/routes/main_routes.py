from flask import Blueprint, render_template, request
from sqlalchemy import desc
from app.models.models import Team, Match, Stadium, Season, Score

# Create blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Route for the home page"""
   
    # Check if season filter is applied
    season_filter = request.args.get('season')
   
    # Get teams for leaderboard (empty lists for now until DB is populated)
    try:
        teams = Team.query.all()
        # Sort teams by wins and points for the leaderboard
        sorted_teams = sorted(teams, key=lambda team: (team.wins, team.points), reverse=True)
    except:
        # If database tables don't exist yet
        sorted_teams = []
   
    # Get seasons for the dropdown
    try:
        seasons = Season.query.order_by(desc(Season.Year)).all()
    except:
        # If database tables don't exist yet
        seasons = [{'Year': 2023}, {'Year': 2022}, {'Year': 2021}]
   
    # Get upcoming matches (status 0)
    try:
        upcoming_query = Match.query.filter_by(Status=0)
   
        # Apply season filter if provided
        if season_filter and season_filter != 'all':
            # Find the season with the provided year
            season = Season.query.filter_by(Year=season_filter).first()
            if season:
                upcoming_query = upcoming_query.filter_by(SeasonId=season.SeasonId)
   
        upcoming_matches = upcoming_query.order_by(Match.MatchDate).limit(4).all()
    except:
        # If database tables don't exist yet
        upcoming_matches = []
   
    # Get recent matches (status 2 - completed)
    try:
        recent_query = Match.query.filter_by(Status=2)
   
        # Apply season filter if provided
        if season_filter and season_filter != 'all':
            # Find the season with the provided year
            season = Season.query.filter_by(Year=season_filter).first()
            if season:
                recent_query = recent_query.filter_by(SeasonId=season.SeasonId)
   
        recent_matches = recent_query.order_by(desc(Match.MatchDate)).limit(3).all()
    except:
        # If database tables don't exist yet
        recent_matches = []
   
    return render_template('index.html',
                          teams=sorted_teams,
                          seasons=seasons,
                          upcoming_matches=upcoming_matches,
                          recent_matches=recent_matches,
                          selected_season=season_filter)

@main_bp.route('/visualise')
def visualise():
    """Route for data visualization page"""
    return render_template('visualise.html')

@main_bp.route('/share')
def share():
    """Route for sharing data page"""
    return render_template('share.html')

@main_bp.route('/upload')
def upload():
    """Route for uploading data page"""
    return render_template('upload.html')