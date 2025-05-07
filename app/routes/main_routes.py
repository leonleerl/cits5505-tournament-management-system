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
    
    # Get teams for leaderboard
    teams = Team.query.all()
    
    # Sort teams by wins and points for the leaderboard
    sorted_teams = sorted(teams, key=lambda team: (team.wins, team.points), reverse=True)
    
    # Get seasons for the dropdown
    seasons = Season.query.order_by(desc(Season.Year)).all()
    
    # Get upcoming matches (status 0)
    upcoming_query = Match.query.filter_by(Status=0)
    
    # Apply season filter if provided
    if season_filter and season_filter != 'all':
        # Find the season with the provided year
        season = Season.query.filter_by(Year=season_filter).first()
        if season:
            upcoming_query = upcoming_query.filter_by(SeasonId=season.SeasonId)
    
    upcoming_matches = upcoming_query.order_by(Match.MatchDate).limit(4).all()
    
    # Get recent matches (status 2 - completed)
    recent_query = Match.query.filter_by(Status=2)
    
    # Apply season filter if provided
    if season_filter and season_filter != 'all':
        # Find the season with the provided year
        season = Season.query.filter_by(Year=season_filter).first()
        if season:
            recent_query = recent_query.filter_by(SeasonId=season.SeasonId)
    
    recent_matches = recent_query.order_by(desc(Match.MatchDate)).limit(3).all()
    
    return render_template('index.html', 
                          teams=sorted_teams,
                          seasons=seasons,
                          upcoming_matches=upcoming_matches,
                          recent_matches=recent_matches,
                          selected_season=season_filter) 