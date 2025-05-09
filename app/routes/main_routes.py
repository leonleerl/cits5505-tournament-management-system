from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory
from flask_login import login_required, current_user
from sqlalchemy import desc
import pandas as pd
from datetime import datetime
import os
import re
from app.models.models import User, Tournament, Team, Player, Match, MatchScore, PlayerStats, ChatMessage, TournamentAccess, db
from app.forms.forms import TournamentUploadForm

# Create blueprint
main_bp = Blueprint('main', __name__)

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Helper function to normalize column names (strips asterisks)
def normalize_columns(df):
    # Create a mapping of original column names to normalized ones
    column_map = {col: re.sub(r'[*]', '', col) for col in df.columns}
    # Rename columns
    return df.rename(columns=column_map), column_map

@main_bp.route('/download_template')
def download_template():
    """Route to download the tournament Excel template"""
    try:
        # Flask's way of getting the app's root directory
        from flask import current_app
        import os
        
        # Set the path to the template file within the app structure
        # current_app.root_path should point to the 'app' directory
        file_path = os.path.join(current_app.root_path, 'app', 'static', 'templates', 'Tournament Upload Template.xlsx')
        
        # For debugging
        print(f"Looking for file at: {file_path}")
        print(f"File exists: {os.path.exists(file_path)}")
        
        # Check if the file exists
        if not os.path.exists(file_path):
            # Try to create the directory structure if it doesn't exist
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            flash('Template file not found. Please ensure it is placed in the correct location.', 'danger')
            return redirect(url_for('main.upload'))
        
        # File exists, send it
        return send_from_directory(
            os.path.dirname(file_path),
            os.path.basename(file_path),
            as_attachment=True
        )
    except Exception as e:
        print(f"Error downloading template: {str(e)}")
        flash(f'Error downloading template: {str(e)}', 'danger')
        return redirect(url_for('main.upload'))

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
    form = TournamentUploadForm()
    
    if form.validate_on_submit():
        file = form.file.data
        
        if file and allowed_file(file.filename):
            try:
                # Process tournament Excel file
                xls = pd.ExcelFile(file)
                
                # Map expected sheet names to actual sheet names for flexibility
                sheet_mapping = {
                    "Tournament Details": ["Tournament Details", "Tournament"],
                    "Teams": ["Teams"],
                    "Players": ["Players"],
                    "Matches": ["Matches"],
                    "Match Scores": ["Match Scores"],
                    "Player Stats": ["Player Stats"]
                }
                
                # Check for the required sheets using the mapping
                missing_sheets = []
                actual_sheet_names = {}
                
                for expected_sheet, alternatives in sheet_mapping.items():
                    found = False
                    for alt in alternatives:
                        if alt in xls.sheet_names:
                            actual_sheet_names[expected_sheet] = alt
                            found = True
                            break
                    
                    if not found:
                        missing_sheets.append(expected_sheet)
                
                if missing_sheets:
                    flash(f'Missing required sheets: {", ".join(missing_sheets)}', 'danger')
                    return redirect(request.url)
                
                # 1. Process Tournament Details/Tournament sheet
                tournament_df = pd.read_excel(xls, actual_sheet_names["Tournament Details"])
                # Normalize column names by removing asterisks
                tournament_df, tour_col_map = normalize_columns(tournament_df)
                
                if tournament_df.empty:
                    flash('Tournament sheet is empty', 'danger')
                    return redirect(request.url)
                
                t_row = tournament_df.iloc[0]  # Get first row
                
                # Check required fields (now without asterisks)
                required_fields = ['name', 'year', 'start_date', 'end_date']
                missing_fields = [field for field in required_fields if field not in tournament_df.columns or pd.isna(t_row[field])]
                
                if missing_fields:
                    flash(f'Missing required fields in Tournament sheet: {", ".join(missing_fields)}', 'danger')
                    return redirect(request.url)
                
                # Convert dates properly - handle different formats
                try:
                    start_date = pd.to_datetime(t_row['start_date']).date()
                    end_date = pd.to_datetime(t_row['end_date']).date()
                except Exception as e:
                    flash(f'Error parsing dates: {str(e)}. Please ensure dates are in a valid format (e.g., DD/MM/YYYY).', 'danger')
                    return redirect(request.url)
                
                tournament = Tournament(
                    name=t_row['name'],
                    description=t_row.get('description', ''),
                    year=int(t_row['year']),
                    start_date=start_date,
                    end_date=end_date,
                    creator_id=current_user.id
                )
                db.session.add(tournament)
                db.session.flush()  # Get tournament ID
                
                # 2. Process Teams
                teams_df = pd.read_excel(xls, actual_sheet_names["Teams"])
                # Normalize column names
                teams_df, teams_col_map = normalize_columns(teams_df)
                
                team_map = {}  # To store team_id mapping
                
                if teams_df.empty:
                    flash('Teams sheet is empty', 'danger')
                    return redirect(request.url)
                
                # Check required fields
                required_fields = ['team_id', 'name']
                missing_fields = [field for field in required_fields if field not in teams_df.columns]
                
                if missing_fields:
                    flash(f'Missing required fields in Teams sheet: {", ".join(missing_fields)}', 'danger')
                    return redirect(request.url)
                
                for _, row in teams_df.iterrows():
                    # Skip rows with missing required values
                    if pd.isna(row['team_id']) or pd.isna(row['name']):
                        continue
                    
                    team = Team(
                        name=row['name'],
                        created_year=int(row['created_year']) if 'created_year' in row and not pd.isna(row['created_year']) else None,
                        logo_shape_type=int(row['logo_shape_type']) if 'logo_shape_type' in row and not pd.isna(row['logo_shape_type']) else 1,
                        primary_color=row['primary_color'] if 'primary_color' in row and not pd.isna(row['primary_color']) else '#000000',
                        secondary_color=row['secondary_color'] if 'secondary_color' in row and not pd.isna(row['secondary_color']) else '#FFFFFF',
                        wins=int(row['wins']) if 'wins' in row and not pd.isna(row['wins']) else 0,
                        losses=int(row['losses']) if 'losses' in row and not pd.isna(row['losses']) else 0,
                        points=int(row['points']) if 'points' in row and not pd.isna(row['points']) else 0,
                        creator_id=current_user.id,
                        tournament_id=tournament.id
                    )
                    db.session.add(team)
                    db.session.flush()
                    team_map[int(row['team_id'])] = team.id
                
                # 3. Process Players
                players_df = pd.read_excel(xls, actual_sheet_names["Players"])
                # Normalize column names
                players_df, players_col_map = normalize_columns(players_df)
                
                player_map = {}  # To store player_id mapping
                
                if players_df.empty:
                    flash('Players sheet is empty', 'danger')
                    return redirect(request.url)
                
                # Check required fields
                required_fields = ['player_id', 'name', 'position', 'jersey_number', 'team_id']
                missing_fields = [field for field in required_fields if field not in players_df.columns]
                
                if missing_fields:
                    flash(f'Missing required fields in Players sheet: {", ".join(missing_fields)}', 'danger')
                    return redirect(request.url)
                
                for _, row in players_df.iterrows():
                    # Skip rows with missing required values
                    if (pd.isna(row['player_id']) or pd.isna(row['name']) or 
                        pd.isna(row['position']) or pd.isna(row['jersey_number']) or 
                        pd.isna(row['team_id'])):
                        continue
                    
                    # Skip players with team_id not in the team map
                    team_id_int = int(row['team_id'])
                    if team_id_int not in team_map:
                        continue
                    
                    player = Player(
                        name=row['name'],
                        height=int(row['height']) if 'height' in row and not pd.isna(row['height']) else None,
                        weight=int(row['weight']) if 'weight' in row and not pd.isna(row['weight']) else None,
                        position=row['position'],
                        jersey_number=int(row['jersey_number']),
                        team_id=team_map[team_id_int],
                        creator_id=current_user.id
                    )
                    db.session.add(player)
                    db.session.flush()
                    player_map[int(row['player_id'])] = player.id
                
                # 4. Process Matches
                matches_df = pd.read_excel(xls, actual_sheet_names["Matches"])
                # Normalize column names
                matches_df, matches_col_map = normalize_columns(matches_df)
                
                match_map = {}  # To store match_id mapping
                
                if matches_df.empty:
                    flash('Matches sheet is empty', 'danger')
                    return redirect(request.url)
                
                # Check required fields
                required_fields = ['match_id', 'team1_id', 'team2_id', 'match_date']
                missing_fields = [field for field in required_fields if field not in matches_df.columns]
                
                if missing_fields:
                    flash(f'Missing required fields in Matches sheet: {", ".join(missing_fields)}', 'danger')
                    return redirect(request.url)
                
                for _, row in matches_df.iterrows():
                    # Skip rows with missing required values
                    if (pd.isna(row['match_id']) or pd.isna(row['team1_id']) or 
                        pd.isna(row['team2_id']) or pd.isna(row['match_date'])):
                        continue
                    
                    # Skip matches with team_id not in the team map
                    team1_id_int = int(row['team1_id'])
                    team2_id_int = int(row['team2_id'])
                    if team1_id_int not in team_map or team2_id_int not in team_map:
                        continue
                    
                    # Handle different date formats
                    try:
                        match_date = pd.to_datetime(row['match_date'])
                    except Exception as e:
                        flash(f'Error parsing match date: {str(e)}. Row with match_id={row["match_id"]}', 'danger')
                        return redirect(request.url)
                    
                    match = Match(
                        tournament_id=tournament.id,
                        team1_id=team_map[team1_id_int],
                        team2_id=team_map[team2_id_int],
                        venue_name=row['venue_name'] if 'venue_name' in row and not pd.isna(row['venue_name']) else None,
                        match_date=match_date,
                        creator_id=current_user.id
                    )
                    db.session.add(match)
                    db.session.flush()
                    match_map[int(row['match_id'])] = match.id
                
                # 5. Process Match Scores
                scores_df = pd.read_excel(xls, actual_sheet_names["Match Scores"])
                # Normalize column names
                scores_df, scores_col_map = normalize_columns(scores_df)
                
                if not scores_df.empty:
                    # Check required fields
                    required_fields = ['match_id', 'team1_score', 'team2_score']
                    missing_fields = [field for field in required_fields if field not in scores_df.columns]
                    
                    if missing_fields:
                        flash(f'Missing required fields in Match Scores sheet: {", ".join(missing_fields)}', 'danger')
                        return redirect(request.url)
                    
                    for _, row in scores_df.iterrows():
                        # Skip rows with missing required values
                        if (pd.isna(row['match_id']) or pd.isna(row['team1_score']) or 
                            pd.isna(row['team2_score'])):
                            continue
                        
                        # Skip scores with match_id not in the match map
                        match_id_int = int(row['match_id'])
                        if match_id_int not in match_map:
                            continue
                        
                        score = MatchScore(
                            match_id=match_map[match_id_int],
                            team1_score=int(row['team1_score']),
                            team2_score=int(row['team2_score'])
                        )
                        db.session.add(score)
                
                # 6. Process Player Stats
                stats_df = pd.read_excel(xls, actual_sheet_names["Player Stats"])
                # Normalize column names
                stats_df, stats_col_map = normalize_columns(stats_df)
                
                if not stats_df.empty:
                    # Check required fields
                    required_fields = ['match_id', 'player_id', 'points', 'rebounds', 'assists']
                    missing_fields = [field for field in required_fields if field not in stats_df.columns]
                    
                    if missing_fields:
                        flash(f'Missing required fields in Player Stats sheet: {", ".join(missing_fields)}', 'danger')
                        return redirect(request.url)
                    
                    for _, row in stats_df.iterrows():
                        # Skip rows with missing required values
                        if (pd.isna(row['match_id']) or pd.isna(row['player_id']) or 
                            pd.isna(row['points']) or pd.isna(row['rebounds']) or 
                            pd.isna(row['assists'])):
                            continue
                        
                        # Skip stats with match_id or player_id not in the maps
                        match_id_int = int(row['match_id'])
                        player_id_int = int(row['player_id'])
                        
                        if match_id_int not in match_map or player_id_int not in player_map:
                            continue
                        
                        stats = PlayerStats(
                            match_id=match_map[match_id_int],
                            player_id=player_map[player_id_int],
                            points=int(row['points']),
                            rebounds=int(row['rebounds']),
                            assists=int(row['assists']),
                            steals=int(row['steals']) if 'steals' in row and not pd.isna(row['steals']) else 0,
                            blocks=int(row['blocks']) if 'blocks' in row and not pd.isna(row['blocks']) else 0,
                            turnovers=int(row['turnovers']) if 'turnovers' in row and not pd.isna(row['turnovers']) else 0,
                            three_pointers=int(row['three_pointers']) if 'three_pointers' in row and not pd.isna(row['three_pointers']) else 0
                        )
                        db.session.add(stats)
                
                # Calculate team wins, losses, and points based on match scores
                update_team_statistics(tournament.id)
                
                db.session.commit()
                flash('Tournament uploaded successfully!', 'success')
                return redirect(url_for('main.index'))
            
            except Exception as e:
                db.session.rollback()
                flash(f'Error uploading tournament: {str(e)}', 'danger')
                return redirect(request.url)
    
    return render_template('upload.html', form=form)

def update_team_statistics(tournament_id):
    """Update team wins, losses, and points based on match scores"""
    # Get all matches with scores for this tournament
    matches_with_scores = db.session.query(Match, MatchScore)\
                                     .join(MatchScore)\
                                     .filter(Match.tournament_id == tournament_id)\
                                     .all()
    
    # Reset all team statistics for this tournament
    teams = Team.query.filter_by(tournament_id=tournament_id).all()
    for team in teams:
        team.wins = 0
        team.losses = 0
        team.points = 0
    
    # Update based on match results
    for match, score in matches_with_scores:
        # Determine winner and update stats
        if score.team1_score > score.team2_score:
            # Team 1 wins
            team1 = Team.query.get(match.team1_id)
            team2 = Team.query.get(match.team2_id)
            if team1 and team2:
                team1.wins += 1
                team1.points += 2  # 2 points for a win
                team2.losses += 1
        elif score.team2_score > score.team1_score:
            # Team 2 wins
            team1 = Team.query.get(match.team1_id)
            team2 = Team.query.get(match.team2_id)
            if team1 and team2:
                team2.wins += 1
                team2.points += 2  # 2 points for a win
                team1.losses += 1
        else:
            # Draw
            team1 = Team.query.get(match.team1_id)
            team2 = Team.query.get(match.team2_id)
            if team1 and team2:
                team1.points += 1  # 1 point for a draw
                team2.points += 1  # 1 point for a draw

@main_bp.route('/terms')
def terms():
    return render_template('terms.html')

@main_bp.route('/privacy')
def privacy():
    return render_template('privacy.html')