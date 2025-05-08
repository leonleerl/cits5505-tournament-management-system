from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from sqlalchemy import desc
import pandas as pd
from werkzeug.utils import secure_filename
import os
from app.models.models import User, Tournament, Team, Player, Match, MatchScore, PlayerStats, ChatMessage, TournamentAccess, db

# Create blueprint
main_bp = Blueprint('main', __name__)

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@main_bp.route('/')
def index():
    """Route for the home page"""
   
    # Check if year filter is applied
    year_filter = request.args.get('year')
   
    # Get teams for leaderboard
    teams = Team.query.all()
    # Sort teams by wins and points for the leaderboard
    sorted_teams = sorted(teams, key=lambda team: (team.wins, team.points), reverse=True)
   
    # Get tournament years for the dropdown
    tournament_years = db.session.query(Tournament.year).distinct().order_by(desc(Tournament.year)).all()
    years = [{'year': year[0]} for year in tournament_years]
    
    # If no years found, use current year
    if not years:
        from datetime import datetime
        years = [{'year': datetime.now().year}]
   
    # Get upcoming matches
    # Filter by date > today
    from datetime import datetime
    today = datetime.now()
    upcoming_query = Match.query.filter(Match.match_date > today)
    
    # Apply year filter if provided
    if year_filter and year_filter != 'all':
        # Join with tournament to filter by year
        upcoming_query = upcoming_query.join(Tournament).filter(Tournament.year == year_filter)
    
    upcoming_matches = upcoming_query.order_by(Match.match_date).limit(4).all()
   
    # Get recent matches (matches with scores)
    recent_query = Match.query.join(MatchScore)
    
    # Apply year filter if provided
    if year_filter and year_filter != 'all':
        recent_query = recent_query.join(Tournament).filter(Tournament.year == year_filter)
    
    recent_matches = recent_query.order_by(desc(Match.match_date)).limit(3).all()
   
    return render_template('index.html',
                          teams=sorted_teams,
                          seasons=years,
                          upcoming_matches=upcoming_matches,
                          recent_matches=recent_matches,
                          selected_season=year_filter)

@main_bp.route('/visualise')
def visualise():
    """Route for data visualization page"""
    return render_template('visualise.html')

@main_bp.route('/share', methods=['GET', 'POST'])
@login_required
def share():
    """Route for sharing tournaments with other users"""
    # Get tournaments created by current user
    created_tournaments = Tournament.query.filter_by(creator_id=current_user.id).all()
    
    # Get users with access to each tournament
    tournament_users = {}
    for tournament in created_tournaments:
        users_with_access = [access.user for access in tournament.tournament_access]
        tournament_users[tournament.id] = users_with_access
    
    if request.method == 'POST':
        tournament_id = request.form.get('tournament_id')
        username = request.form.get('username')
        
        # Find user by username
        user = User.query.filter_by(username=username).first()
        if not user:
            flash('User not found.', 'danger')
            return redirect(url_for('main.share'))
        
        # Check if tournament exists and belongs to current user
        tournament = Tournament.query.filter_by(id=tournament_id, creator_id=current_user.id).first()
        if not tournament:
            flash('Tournament not found or you do not have permission to share it.', 'danger')
            return redirect(url_for('main.share'))
        
        # Check if user already has access (using the relationship)
        if user in [access.user for access in tournament.tournament_access]:
            flash('User already has access to this tournament.', 'warning')
            return redirect(url_for('main.share'))
        
        # Create new access
        new_access = TournamentAccess(
            tournament_id=tournament_id,
            user_id=user.id
        )
        
        db.session.add(new_access)
        db.session.commit()
        
        flash(f'Tournament shared with {username} successfully!', 'success')
        return redirect(url_for('main.share'))
    
    return render_template('share.html', tournaments=created_tournaments, tournament_users=tournament_users)

@main_bp.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    """Route for uploading tournament data via Excel"""
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file part', 'danger')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No selected file', 'danger')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            try:
                # Process tournament Excel file
                xls = pd.ExcelFile(file)
                
                # 1. Process Tournament Details
                tournament_df = pd.read_excel(xls, 'Tournament Details')
                t_row = tournament_df.iloc[0]  # Get first row
                
                tournament = Tournament(
                    name=t_row['name'],
                    description=t_row['description'],
                    year=t_row['year'],
                    start_date=t_row['start_date'],
                    end_date=t_row['end_date'],
                    creator_id=current_user.id
                )
                db.session.add(tournament)
                db.session.flush()  # Get tournament ID
                
                # 2. Process Teams
                teams_df = pd.read_excel(xls, 'Teams')
                team_map = {}  # To store team_id mapping
                
                for _, row in teams_df.iterrows():
                    team = Team(
                        name=row['name'],
                        created_year=row['created_year'],
                        logo_shape_type=row['logo_shape_type'],
                        primary_color=row['primary_color'],
                        secondary_color=row['secondary_color'],
                        wins=row.get('wins', 0),
                        losses=row.get('losses', 0),
                        points=row.get('points', 0),
                        creator_id=current_user.id,
                        tournament_id=tournament.id
                    )
                    db.session.add(team)
                    db.session.flush()
                    team_map[row['team_id']] = team.id
                
                # 3. Process Players
                players_df = pd.read_excel(xls, 'Players')
                player_map = {}  # To store player_id mapping
                
                for _, row in players_df.iterrows():
                    player = Player(
                        name=row['name'],
                        height=row.get('height'),
                        weight=row.get('weight'),
                        position=row['position'],
                        jersey_number=row['jersey_number'],
                        team_id=team_map[row['team_id']],
                        creator_id=current_user.id
                    )
                    db.session.add(player)
                    db.session.flush()
                    player_map[row['player_id']] = player.id
                
                # 4. Process Matches
                matches_df = pd.read_excel(xls, 'Matches')
                match_map = {}  # To store match_id mapping
                
                for _, row in matches_df.iterrows():
                    match = Match(
                        tournament_id=tournament.id,
                        team1_id=team_map[row['team1_id']],
                        team2_id=team_map[row['team2_id']],
                        venue_name=row.get('venue_name'),
                        match_date=row['match_date'],
                        creator_id=current_user.id
                    )
                    db.session.add(match)
                    db.session.flush()
                    match_map[row['match_id']] = match.id
                
                # 5. Process Match Scores
                scores_df = pd.read_excel(xls, 'Match Scores')
                
                for _, row in scores_df.iterrows():
                    score = MatchScore(
                        match_id=match_map[row['match_id']],
                        team1_score=row['team1_score'],
                        team2_score=row['team2_score']
                    )
                    db.session.add(score)
                
                # 6. Process Player Stats
                stats_df = pd.read_excel(xls, 'Player Stats')
                
                for _, row in stats_df.iterrows():
                    stats = PlayerStats(
                        match_id=match_map[row['match_id']],
                        player_id=player_map[row['player_id']],
                        points=row['points'],
                        rebounds=row['rebounds'],
                        assists=row['assists'],
                        steals=row['steals'],
                        blocks=row['blocks'],
                        turnovers=row['turnovers'],
                        three_pointers=row['three_pointers']
                    )
                    db.session.add(stats)
                
                db.session.commit()
                flash('Tournament uploaded successfully!', 'success')
                return redirect(url_for('main.index'))
            
            except Exception as e:
                db.session.rollback()
                flash(f'Error uploading tournament: {str(e)}', 'danger')
                return redirect(request.url)
    
    return render_template('upload.html')