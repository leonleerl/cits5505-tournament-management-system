from flask import Blueprint, render_template, request, redirect, url_for, flash, send_from_directory, jsonify
from flask_login import login_required, current_user
from sqlalchemy import desc
import pandas as pd
from datetime import datetime
import os
import re
from app.models.models import User, Tournament, Team, Player, Match, MatchScore, PlayerStats, ChatMessage, TournamentAccess, db
from app.forms.forms import (TournamentUploadForm, TournamentDetailsForm, TeamForm, PlayerForm, MatchForm, DeleteConfirmForm)

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


@main_bp.route('/visualise')
def visualise():
    """Route for data visualization page"""
    # Get tournaments that the current user has access to
    if current_user.is_authenticated:
        # Get tournaments created by the user
        created_tournaments = Tournament.query.filter_by(creator_id=current_user.id).all()
        
        # Get tournaments shared with the user
        shared_tournament_ids = db.session.query(TournamentAccess.tournament_id)\
            .filter_by(user_id=current_user.id).all()
        shared_tournament_ids = [t[0] for t in shared_tournament_ids]
        
        shared_tournaments = Tournament.query.filter(Tournament.id.in_(shared_tournament_ids)).all()
        
        # Combine both lists
        tournaments = created_tournaments + shared_tournaments
        
        # Remove duplicates
        tournaments = list({t.id: t for t in tournaments}.values())
    else:
        tournaments = []
    
    return render_template('visualise.html', tournaments=tournaments)

# Visualisation API Endpoints
@main_bp.route('/api/tournament_data', methods=['GET'])
@login_required
def get_tournament_data():
    """API endpoint to get tournament data for visualizations"""
    try:
        tournament_id = request.args.get('tournament_id', 'all')
        team_id = request.args.get('team_id', 'all')
        player_id = request.args.get('player_id', 'all')
        
        # Initialize response data
        response = {
            'summary': {},
            'team_standings': {},
            'points_distribution': {},
            'top_scorers': {},
            'player_efficiency': {},
            'match_score_trends': {},
            'double_triple_leaders': {},
            'team_records': {}
        }
        
        # If tournament_id is 'all', get data across all accessible tournaments
        if tournament_id == 'all':
            # Get tournaments created by the user
            created_tournament_ids = [t.id for t in Tournament.query.filter_by(creator_id=current_user.id).all()]
            
            # Get tournaments shared with the user
            shared_tournament_ids = [t[0] for t in db.session.query(TournamentAccess.tournament_id)
                                .filter_by(user_id=current_user.id).all()]
            
            # Combine both lists
            tournament_ids = list(set(created_tournament_ids + shared_tournament_ids))
        else:
            # Check if user has access to the specified tournament
            tournament = Tournament.query.get_or_404(tournament_id)
            if tournament.creator_id != current_user.id and not TournamentAccess.query.filter_by(
                tournament_id=tournament_id, user_id=current_user.id).first():
                return jsonify({'error': 'Access denied'}), 403
            
            tournament_ids = [int(tournament_id)]
        
        # Get tournament summary data
        tournaments = Tournament.query.filter(Tournament.id.in_(tournament_ids)).all()
        
        # Get teams for these tournaments
        teams_query = Team.query.filter(Team.tournament_id.in_(tournament_ids))
        
        # Apply team filter if specified
        if team_id != 'all':
            teams_query = teams_query.filter_by(id=team_id)
        
        teams = teams_query.all()
        team_ids = [team.id for team in teams]
        
        # Get players for these teams
        players_query = Player.query.filter(Player.team_id.in_(team_ids))
        
        # Apply player filter if specified
        if player_id != 'all':
            players_query = players_query.filter_by(id=player_id)
        
        players = players_query.all()
        player_ids = [player.id for player in players]
        
        # Get matches for these tournaments
        matches = Match.query.filter(Match.tournament_id.in_(tournament_ids)).all()
        match_ids = [match.id for match in matches]
        
        # Get match scores
        match_scores = MatchScore.query.filter(MatchScore.match_id.in_(match_ids)).all()
        
        # Get player stats
        player_stats_query = PlayerStats.query.filter(PlayerStats.match_id.in_(match_ids))
        
        # Apply player filter if specified
        if player_id != 'all':
            player_stats_query = player_stats_query.filter(PlayerStats.player_id.in_(player_ids))
        
        player_stats = player_stats_query.all()
        
        # Process the data for visualizations
        
        # Summary data
        response['summary'] = {
            'teams_count': len(teams),
            'players_count': len(players),
            'matches_count': len(matches),
            'avg_points_per_game': _calculate_avg_points_per_game(match_scores) if match_scores else 0
        }
        
        # Team standings
        response['team_standings'] = _get_team_standings_data(teams)
        
        # Points distribution
        response['points_distribution'] = _get_points_distribution_data(teams, match_scores)
        
        # Top scorers
        response['top_scorers'] = _get_top_scorers_data(players, player_stats)
        
        # Player efficiency
        response['player_efficiency'] = _get_player_efficiency_data(players, player_stats)
        
        # Match score trends
        response['match_score_trends'] = _get_match_score_trends_data(matches, match_scores)
        
        # Double-triple leaders
        response['double_triple_leaders'] = _get_double_triple_leaders_data(players, player_stats)
        
        # Team records
        response['team_records'] = _get_team_records_data(teams, match_scores)
        
        return jsonify(response)
    
    except Exception as e:
        print(f"Error in get_tournament_data: {str(e)}")
        return jsonify({'error': str(e)}), 500


@main_bp.route('/api/teams', methods=['GET'])
@login_required
def get_teams():
    """API endpoint to get teams for a tournament"""
    try:
        tournament_id = request.args.get('tournament_id')
        
        if not tournament_id or tournament_id == 'all':
            return jsonify([])
        
        # Check if user has access to the tournament
        tournament = Tournament.query.get_or_404(tournament_id)
        if tournament.creator_id != current_user.id and not TournamentAccess.query.filter_by(
            tournament_id=tournament_id, user_id=current_user.id).first():
            return jsonify({'error': 'Access denied'}), 403
        
        # Get teams for the tournament
        teams = Team.query.filter_by(tournament_id=tournament_id).all()
        
        # Format the response
        team_list = [{'id': team.id, 'name': team.name} for team in teams]
        
        return jsonify(team_list)
    except Exception as e:
        print(f"Error in get_teams: {str(e)}")
        return jsonify({'error': str(e)}), 500

@main_bp.route('/api/players', methods=['GET'])
@login_required
def get_players():
    """API endpoint to get players for a team"""
    try:
        team_id = request.args.get('team_id')
        
        if not team_id or team_id == 'all':
            return jsonify([])
        
        # Get team to check tournament access
        team = Team.query.get_or_404(team_id)
        
        # Check if user has access to the tournament
        tournament = Tournament.query.get_or_404(team.tournament_id)
        if tournament.creator_id != current_user.id and not TournamentAccess.query.filter_by(
            tournament_id=tournament.id, user_id=current_user.id).first():
            return jsonify({'error': 'Access denied'}), 403
        
        # Get players for the team
        players = Player.query.filter_by(team_id=team_id).all()
        
        # Format the response
        player_list = [{'id': player.id, 'name': player.name} for player in players]
        
        return jsonify(player_list)
    
    except Exception as e:
        print(f"Error in get_players: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Helper functions for processing data

def _calculate_avg_points_per_game(match_scores):
    """Calculate the average points per game"""
    if not match_scores:
        return 0
    
    total_points = sum(score.team1_score + score.team2_score for score in match_scores)
    return round(total_points / (len(match_scores) * 2), 1)  # Divide by 2 teams per match

def _get_team_standings_data(teams):
    """Format team standings data for visualization"""
    if not teams:
        return {'labels': [], 'wins': [], 'losses': []}
    
    # Sort teams by wins (descending)
    sorted_teams = sorted(teams, key=lambda team: team.wins, reverse=True)
    
    return {
        'labels': [team.name for team in sorted_teams],
        'wins': [team.wins for team in sorted_teams],
        'losses': [team.losses for team in sorted_teams]
    }

def _get_points_distribution_data(teams, match_scores):
    """Format points distribution data for visualization"""
    if not teams or not match_scores:
        return {'labels': [], 'points_scored': [], 'points_conceded': []}
    
    # Create a dictionary to store team data
    team_data = {team.id: {
        'name': team.name,
        'points_scored': 0,
        'points_conceded': 0,
        'games_played': 0
    } for team in teams}
    
    # Process match scores
    for score in match_scores:
        match = Match.query.get(score.match_id)
        
        # Process team1 data
        if match.team1_id in team_data:
            team_data[match.team1_id]['points_scored'] += score.team1_score
            team_data[match.team1_id]['points_conceded'] += score.team2_score
            team_data[match.team1_id]['games_played'] += 1
        
        # Process team2 data
        if match.team2_id in team_data:
            team_data[match.team2_id]['points_scored'] += score.team2_score
            team_data[match.team2_id]['points_conceded'] += score.team1_score
            team_data[match.team2_id]['games_played'] += 1
    
    # Calculate averages
    for team_id, data in team_data.items():
        if data['games_played'] > 0:
            data['points_scored'] = round(data['points_scored'] / data['games_played'], 1)
            data['points_conceded'] = round(data['points_conceded'] / data['games_played'], 1)
    
    # Sort by points scored (descending)
    sorted_teams = sorted(team_data.values(), key=lambda x: x['points_scored'], reverse=True)
    
    return {
        'labels': [team['name'] for team in sorted_teams],
        'points_scored': [team['points_scored'] for team in sorted_teams],
        'points_conceded': [team['points_conceded'] for team in sorted_teams]
    }

def _get_top_scorers_data(players, player_stats):
    """Format top scorers data for visualization"""
    if not players or not player_stats:
        return {'labels': [], 'points': [], 'teams': []}
    
    # Create a dictionary to store player data
    player_data = {player.id: {
        'name': player.name,
        'total_points': 0,
        'games_played': 0,
        'team': Team.query.get(player.team_id).name
    } for player in players}
    
    # Process player stats
    for stat in player_stats:
        if stat.player_id in player_data:
            player_data[stat.player_id]['total_points'] += stat.points
            player_data[stat.player_id]['games_played'] += 1
    
    # Calculate averages
    for player_id, data in player_data.items():
        if data['games_played'] > 0:
            data['ppg'] = round(data['total_points'] / data['games_played'], 1)
        else:
            data['ppg'] = 0
    
    # Sort by PPG (descending) and take top 5
    sorted_players = sorted(player_data.values(), key=lambda x: x['ppg'], reverse=True)[:5]
    
    return {
        'labels': [f"{player['name'].split(' ')[0][0]}. {player['name'].split(' ')[-1]}" for player in sorted_players],
        'points': [player['ppg'] for player in sorted_players],
        'teams': [player['team'] for player in sorted_players]
    }

def _get_player_efficiency_data(players, player_stats):
    """Format player efficiency data for visualization"""
    if not players or not player_stats:
        return {'labels': [], 'efficiency': [], 'teams': []}
    
    # Create a dictionary to store player data
    player_data = {player.id: {
        'name': player.name,
        'total_efficiency': 0,
        'games_played': 0,
        'team': Team.query.get(player.team_id).name
    } for player in players}
    
    # Process player stats
    for stat in player_stats:
        if stat.player_id in player_data:
            player_data[stat.player_id]['total_efficiency'] += stat.efficiency
            player_data[stat.player_id]['games_played'] += 1
    
    # Calculate averages
    for player_id, data in player_data.items():
        if data['games_played'] > 0:
            data['avg_efficiency'] = round(data['total_efficiency'] / data['games_played'], 1)
        else:
            data['avg_efficiency'] = 0
    
    # Sort by efficiency (descending) and take top 5
    sorted_players = sorted(player_data.values(), key=lambda x: x['avg_efficiency'], reverse=True)[:5]
    
    return {
        'labels': [f"{player['name'].split(' ')[0][0]}. {player['name'].split(' ')[-1]}" for player in sorted_players],
        'efficiency': [player['avg_efficiency'] for player in sorted_players],
        'teams': [player['team'] for player in sorted_players]
    }

def _get_match_score_trends_data(matches, match_scores):
    """Format match score trends data for visualization"""
    if not matches or not match_scores:
        return {'labels': [], 'winning_scores': [], 'losing_scores': [], 'avg_scores': []}
    
    # Create a dictionary to map match_id to match_score
    score_map = {score.match_id: score for score in match_scores}
    
    # Filter matches with scores and sort by date
    scored_matches = [match for match in matches if match.id in score_map]
    sorted_matches = sorted(scored_matches, key=lambda x: x.match_date)[:10]  # Last 10 matches
    
    labels = []
    winning_scores = []
    losing_scores = []
    avg_scores = []
    
    for idx, match in enumerate(sorted_matches):
        score = score_map[match.id]
        
        # Create labels (Game 1, Game 2, etc.)
        labels.append(f"Game {idx+1}")
        
        # Determine winning and losing scores
        if score.team1_score >= score.team2_score:
            winning_scores.append(score.team1_score)
            losing_scores.append(score.team2_score)
        else:
            winning_scores.append(score.team2_score)
            losing_scores.append(score.team1_score)
        
        # Calculate average score
        avg_scores.append(round((score.team1_score + score.team2_score) / 2, 1))
    
    return {
        'labels': labels,
        'winning_scores': winning_scores,
        'losing_scores': losing_scores,
        'avg_scores': avg_scores
    }

def _get_double_triple_leaders_data(players, player_stats):
    """Format double-double and triple-double leaders data for visualization"""
    if not players or not player_stats:
        return {'labels': [], 'double_doubles': [], 'triple_doubles': []}
    
    # Create a dictionary to store player data
    player_data = {player.id: {
        'name': player.name,
        'double_doubles': 0,
        'triple_doubles': 0
    } for player in players}
    
    # Process player stats
    for stat in player_stats:
        if stat.player_id in player_data:
            if stat.double_double:
                player_data[stat.player_id]['double_doubles'] += 1
            if stat.triple_double:
                player_data[stat.player_id]['triple_doubles'] += 1
    
    # Sort by double-doubles and triple-doubles (descending) and take top 5
    sorted_players = sorted(
        player_data.values(),
        key=lambda x: (x['triple_doubles'], x['double_doubles']),
        reverse=True
    )[:5]
    
    return {
        'labels': [f"{player['name'].split(' ')[0][0]}. {player['name'].split(' ')[-1]}" for player in sorted_players],
        'double_doubles': [player['double_doubles'] for player in sorted_players],
        'triple_doubles': [player['triple_doubles'] for player in sorted_players]
    }

def _get_team_records_data(teams, match_scores):
    """Format team records data for visualization"""
    if not teams or not match_scores:
        return []
    
    # Create a dictionary to store team data
    team_data = {team.id: {
        'team': team.name,
        'wins': team.wins,
        'losses': team.losses,
        'win_pct': round(team.wins / (team.wins + team.losses) * 100, 1) if (team.wins + team.losses) > 0 else 0,
        'pts_scored': 0,
        'pts_allowed': 0,
        'games_played': 0
    } for team in teams}
    
    # Process match scores
    for score in match_scores:
        match = Match.query.get(score.match_id)
        
        # Process team1 data
        if match.team1_id in team_data:
            team_data[match.team1_id]['pts_scored'] += score.team1_score
            team_data[match.team1_id]['pts_allowed'] += score.team2_score
            team_data[match.team1_id]['games_played'] += 1
        
        # Process team2 data
        if match.team2_id in team_data:
            team_data[match.team2_id]['pts_scored'] += score.team2_score
            team_data[match.team2_id]['pts_allowed'] += score.team1_score
            team_data[match.team2_id]['games_played'] += 1
    
    # Calculate averages and point differential
    for team_id, data in team_data.items():
        if data['games_played'] > 0:
            data['pts_scored'] = round(data['pts_scored'] / data['games_played'], 1)
            data['pts_allowed'] = round(data['pts_allowed'] / data['games_played'], 1)
            data['diff'] = round(data['pts_scored'] - data['pts_allowed'], 1)
        else:
            data['pts_scored'] = 0
            data['pts_allowed'] = 0
            data['diff'] = 0
    
    # Sort by win percentage (descending)
    sorted_teams = sorted(team_data.values(), key=lambda x: x['win_pct'], reverse=True)
    
    return sorted_teams

@main_bp.route('/api/player_stats', methods=['GET'])
@login_required
def get_player_stats():
    """API endpoint to get detailed player statistics"""
    try:
        player_id = request.args.get('player_id')
        
        if not player_id:
            return jsonify({'error': 'Missing player_id parameter'}), 400
        
        # Get player details
        player = Player.query.get_or_404(player_id)
        
        # Get team to check tournament access
        team = Team.query.get_or_404(player.team_id)
        
        # Check if user has access to the tournament
        tournament = Tournament.query.get_or_404(team.tournament_id)
        if tournament.creator_id != current_user.id and not TournamentAccess.query.filter_by(
            tournament_id=tournament.id, user_id=current_user.id).first():
            return jsonify({'error': 'Access denied'}), 403
        
        # Get player stats from all matches
        player_stats = PlayerStats.query.filter_by(player_id=player_id).all()
        
        if not player_stats:
            # No stats available, return default data
            return jsonify({
                'player_name': player.name,
                'team_name': team.name,
                'stat_labels': ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', '3-Pointers'],
                'player_stats': [0, 0, 0, 0, 0, 0],
                'league_avg_stats': [15.7, 5.2, 4.3, 1.1, 0.6, 1.8]
            })
        
        # Calculate averages
        total_games = len(player_stats)
        avg_points = sum(stat.points for stat in player_stats) / total_games
        avg_rebounds = sum(stat.rebounds for stat in player_stats) / total_games
        avg_assists = sum(stat.assists for stat in player_stats) / total_games
        avg_steals = sum(stat.steals for stat in player_stats) / total_games
        avg_blocks = sum(stat.blocks for stat in player_stats) / total_games
        avg_three_pointers = sum(stat.three_pointers for stat in player_stats) / total_games
        
        # Calculate league averages from all players, but using fixed values for simplicity
        # Could be calculated dynamically based on all player stats in the future
        league_avg_points = 15.7
        league_avg_rebounds = 5.2
        league_avg_assists = 4.3
        league_avg_steals = 1.1
        league_avg_blocks = 0.6
        league_avg_three_pointers = 1.8
        
        return jsonify({
            'player_name': player.name,
            'team_name': team.name,
            'stat_labels': ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', '3-Pointers'],
            'player_stats': [
                round(avg_points, 1),
                round(avg_rebounds, 1),
                round(avg_assists, 1),
                round(avg_steals, 1),
                round(avg_blocks, 1),
                round(avg_three_pointers, 1)
            ],
            'league_avg_stats': [
                league_avg_points,
                league_avg_rebounds,
                league_avg_assists,
                league_avg_steals,
                league_avg_blocks,
                league_avg_three_pointers
            ]
        })
    
    except Exception as e:
        print(f"Error in get_player_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
# tournament_editor: Tournament Management Routes


@main_bp.route('/tournament-editor')
@login_required
def tournament_editor():
    """Route for the tournament editor interface with WTForms"""
    # Initialize all forms
    tournament_form = TournamentDetailsForm()
    team_form = TeamForm()
    player_form = PlayerForm()
    match_form = MatchForm()
    delete_form = DeleteConfirmForm()
    
    # The team and player select fields need their choices populated dynamically
    # in JavaScript, so we don't need to set them here
    
    return render_template('tournament_editor.html',
                          tournament_form=tournament_form,
                          team_form=team_form,
                          player_form=player_form,
                          match_form=match_form,
                          delete_form=delete_form)

# API Endpoints for Tournament Management

# Tournament endpoints
@main_bp.route('/api/tournaments', methods=['GET'])
@login_required
def get_tournaments():
    """Get tournaments created by the current user with optional search"""
    search_query = request.args.get('q', '')
    
    query = Tournament.query.filter_by(creator_id=current_user.id)
    
    if search_query:
        search_term = f"%{search_query}%"
        query = query.filter(
            db.or_(
                Tournament.name.ilike(search_term),
                Tournament.description.ilike(search_term),
                Tournament.year.cast(db.String).ilike(search_term)
            )
        )
    
    tournaments = query.order_by(Tournament.year.desc(), Tournament.name).all()
    
    result = []
    for tournament in tournaments:
        # Count teams and matches for the tournament
        teams_count = Team.query.filter_by(tournament_id=tournament.id).count()
        matches_count = Match.query.filter_by(tournament_id=tournament.id).count()
        
        result.append({
            'id': tournament.id,
            'name': tournament.name,
            'description': tournament.description or '',
            'year': tournament.year,
            'start_date': tournament.start_date.isoformat() if tournament.start_date else None,
            'end_date': tournament.end_date.isoformat() if tournament.end_date else None,
            'teams_count': teams_count,
            'matches_count': matches_count
        })
    
    return jsonify(result)

@main_bp.route('/api/tournament/<int:tournament_id>', methods=['GET'])
@login_required
def get_tournament(tournament_id):
    """Get details for a specific tournament"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    result = {
        'id': tournament.id,
        'name': tournament.name,
        'description': tournament.description or '',
        'year': tournament.year,
        'start_date': tournament.start_date.isoformat() if tournament.start_date else None,
        'end_date': tournament.end_date.isoformat() if tournament.end_date else None
    }
    
    return jsonify(result)

@main_bp.route('/api/tournament/<int:tournament_id>', methods=['PUT'])
@login_required
def update_tournament(tournament_id):
    """Update tournament details"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    tournament.name = data.get('name', tournament.name)
    tournament.description = data.get('description', tournament.description)
    tournament.year = data.get('year', tournament.year)
    
    if 'start_date' in data and data['start_date']:
        start_date = datetime.fromisoformat(data['start_date'])
        tournament.start_date = start_date.date()
    
    if 'end_date' in data and data['end_date']:
        end_date = datetime.fromisoformat(data['end_date'])
        tournament.end_date = end_date.date()
    
    db.session.commit()
    
    return jsonify({'message': 'Tournament updated successfully'})

@main_bp.route('/api/tournament/<int:tournament_id>', methods=['DELETE'])
@login_required
def delete_tournament(tournament_id):
    """Delete a tournament and all associated data"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Use a transaction to ensure all-or-nothing deletion
    try:
        db.session.begin_nested()
        
        # Delete associated data in correct order (respecting foreign key constraints)
        
        # 1. Delete player stats
        player_ids = db.session.query(Player.id).filter(Player.team_id.in_(
            db.session.query(Team.id).filter_by(tournament_id=tournament_id)
        )).all()
        player_ids = [pid[0] for pid in player_ids]
        
        match_ids = db.session.query(Match.id).filter_by(tournament_id=tournament_id).all()
        match_ids = [mid[0] for mid in match_ids]
        
        PlayerStats.query.filter(
            db.and_(
                PlayerStats.player_id.in_(player_ids),
                PlayerStats.match_id.in_(match_ids)
            )
        ).delete(synchronize_session=False)
        
        # 2. Delete match scores
        MatchScore.query.filter(MatchScore.match_id.in_(match_ids)).delete(synchronize_session=False)
        
        # 3. Delete matches
        Match.query.filter_by(tournament_id=tournament_id).delete(synchronize_session=False)
        
        # 4. Delete players
        Player.query.filter(Player.team_id.in_(
            db.session.query(Team.id).filter_by(tournament_id=tournament_id)
        )).delete(synchronize_session=False)
        
        # 5. Delete teams
        Team.query.filter_by(tournament_id=tournament_id).delete(synchronize_session=False)
        
        # 6. Delete tournament access
        TournamentAccess.query.filter_by(tournament_id=tournament_id).delete(synchronize_session=False)
        
        # 7. Delete the tournament
        db.session.delete(tournament)
        
        db.session.commit()
        
        return jsonify({'message': 'Tournament deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_tournament: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Team Management Endpoints
@main_bp.route('/api/tournament/<int:tournament_id>/teams', methods=['GET'])
@login_required
def get_teams_for_tournament(tournament_id):
    """Get all teams for a tournament"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    teams = Team.query.filter_by(tournament_id=tournament_id).all()
    
    result = []
    for team in teams:
        result.append({
            'id': team.id,
            'name': team.name,
            'created_year': team.created_year,
            'logo_shape_type': team.logo_shape_type,
            'primary_color': team.primary_color,
            'secondary_color': team.secondary_color,
            'wins': team.wins,
            'losses': team.losses,
            'points': team.points
        })
    
    return jsonify(result)

@main_bp.route('/api/tournament/<int:tournament_id>/teams', methods=['POST'])
@login_required
def create_team(tournament_id):
    """Create a new team in a tournament"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate required fields
    if not data.get('name'):
        return jsonify({'error': 'Team name is required'}), 400
    
    team = Team(
        name=data.get('name'),
        created_year=data.get('created_year'),
        logo_shape_type=data.get('logo_shape_type', 1),
        primary_color=data.get('primary_color', '#000000'),
        secondary_color=data.get('secondary_color', '#FFFFFF'),
        wins=data.get('wins', 0),
        losses=data.get('losses', 0),
        points=data.get('points', 0),
        creator_id=current_user.id,
        tournament_id=tournament_id
    )
    
    db.session.add(team)
    db.session.commit()
    
    return jsonify({
        'id': team.id,
        'name': team.name,
        'message': 'Team created successfully'
    }), 201

@main_bp.route('/api/team/<int:team_id>', methods=['GET'])
@login_required
def get_team(team_id):
    """Get details for a specific team"""
    team = Team.query.get_or_404(team_id)
    
    # Check if user has access to the team's tournament
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    result = {
        'id': team.id,
        'name': team.name,
        'created_year': team.created_year,
        'logo_shape_type': team.logo_shape_type,
        'primary_color': team.primary_color,
        'secondary_color': team.secondary_color,
        'wins': team.wins,
        'losses': team.losses,
        'points': team.points,
        'tournament_id': team.tournament_id
    }
    
    return jsonify(result)

@main_bp.route('/api/team/<int:team_id>', methods=['PUT'])
@login_required
def update_team(team_id):
    """Update team details"""
    team = Team.query.get_or_404(team_id)
    
    # Check if user has access to the team's tournament
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate required fields
    if 'name' in data and not data['name']:
        return jsonify({'error': 'Team name is required'}), 400
    
    # Update fields
    if 'name' in data:
        team.name = data['name']
    if 'created_year' in data:
        team.created_year = data['created_year']
    if 'logo_shape_type' in data:
        team.logo_shape_type = data['logo_shape_type']
    if 'primary_color' in data:
        team.primary_color = data['primary_color']
    if 'secondary_color' in data:
        team.secondary_color = data['secondary_color']
    if 'wins' in data:
        team.wins = data['wins']
    if 'losses' in data:
        team.losses = data['losses']
    if 'points' in data:
        team.points = data['points']
    
    db.session.commit()
    
    return jsonify({'message': 'Team updated successfully'})

@main_bp.route('/api/team/<int:team_id>', methods=['DELETE'])
@login_required
def delete_team(team_id):
    """Delete a team and all associated data"""
    team = Team.query.get_or_404(team_id)
    
    # Check if user has access to the team's tournament
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        db.session.begin_nested()
        
        # 1. Get all players for this team
        players = Player.query.filter_by(team_id=team_id).all()
        player_ids = [player.id for player in players]
        
        # 2. Delete player stats for players on this team
        if player_ids:
            PlayerStats.query.filter(PlayerStats.player_id.in_(player_ids)).delete(synchronize_session=False)
        
        # 3. Delete players
        Player.query.filter_by(team_id=team_id).delete(synchronize_session=False)
        
        # 4. Get all matches involving this team
        team_matches = Match.query.filter(
            db.or_(
                Match.team1_id == team_id,
                Match.team2_id == team_id
            )
        ).all()
        match_ids = [match.id for match in team_matches]
        
        # 5. Delete match scores for matches involving this team
        if match_ids:
            MatchScore.query.filter(MatchScore.match_id.in_(match_ids)).delete(synchronize_session=False)
        
        # 6. Delete player stats for matches involving this team
        if match_ids:
            PlayerStats.query.filter(PlayerStats.match_id.in_(match_ids)).delete(synchronize_session=False)
        
        # 7. Delete matches
        for match_id in match_ids:
            Match.query.filter_by(id=match_id).delete(synchronize_session=False)
        
        # 8. Delete the team
        db.session.delete(team)
        
        db.session.commit()
        
        return jsonify({'message': 'Team deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_team: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Player Management Endpoints
@main_bp.route('/api/team/<int:team_id>/players', methods=['GET'])
@login_required
def get_players_for_team(team_id):
    """Get all players for a team"""
    team = Team.query.get_or_404(team_id)
    
    # Check if user has access to the team's tournament
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    players = Player.query.filter_by(team_id=team_id).all()
    
    result = []
    for player in players:
        result.append({
            'id': player.id,
            'name': player.name,
            'height': player.height,
            'weight': player.weight,
            'position': player.position,
            'jersey_number': player.jersey_number,
            'team_id': player.team_id,
            'team_name': team.name
        })
    
    return jsonify(result)

@main_bp.route('/api/tournament/<int:tournament_id>/players', methods=['GET'])
@login_required
def get_players_for_tournament(tournament_id):
    """Get all players in a tournament"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get all team IDs for this tournament
    team_ids = [team.id for team in Team.query.filter_by(tournament_id=tournament_id).all()]
    
    if not team_ids:
        return jsonify([])
    
    # Get all players for these teams
    players = Player.query.filter(Player.team_id.in_(team_ids)).all()
    
    # Create a mapping of team_id to team_name for efficient lookup
    teams = {team.id: team.name for team in Team.query.filter_by(tournament_id=tournament_id).all()}
    
    result = []
    for player in players:
        result.append({
            'id': player.id,
            'name': player.name,
            'height': player.height,
            'weight': player.weight,
            'position': player.position,
            'jersey_number': player.jersey_number,
            'team_id': player.team_id,
            'team_name': teams.get(player.team_id, 'Unknown')
        })
    
    return jsonify(result)

@main_bp.route('/api/team/<int:team_id>/players', methods=['POST'])
@login_required
def create_player(team_id):
    """Create a new player for a team"""
    team = Team.query.get_or_404(team_id)
    
    # Check if user has access to the team's tournament
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate required fields
    for field in ['name', 'position', 'jersey_number']:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    player = Player(
        name=data.get('name'),
        height=data.get('height'),
        weight=data.get('weight'),
        position=data.get('position'),
        jersey_number=data.get('jersey_number'),
        team_id=team_id,
        creator_id=current_user.id
    )
    
    db.session.add(player)
    db.session.commit()
    
    return jsonify({
        'id': player.id,
        'name': player.name,
        'message': 'Player created successfully'
    }), 201

@main_bp.route('/api/player/<int:player_id>', methods=['GET'])
@login_required
def get_player(player_id):
    """Get details for a specific player"""
    player = Player.query.get_or_404(player_id)
    
    # Check if user has access to the player's team's tournament
    team = Team.query.get_or_404(player.team_id)
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    result = {
        'id': player.id,
        'name': player.name,
        'height': player.height,
        'weight': player.weight,
        'position': player.position,
        'jersey_number': player.jersey_number,
        'team_id': player.team_id,
        'team_name': team.name
    }
    
    return jsonify(result)

@main_bp.route('/api/player/<int:player_id>', methods=['PUT'])
@login_required
def update_player(player_id):
    """Update player details"""
    player = Player.query.get_or_404(player_id)
    
    # Check if user has access to the player's team's tournament
    team = Team.query.get_or_404(player.team_id)
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate required fields
    if 'name' in data and not data['name']:
        return jsonify({'error': 'Player name is required'}), 400
    if 'position' in data and not data['position']:
        return jsonify({'error': 'Position is required'}), 400
    if 'jersey_number' in data and not data['jersey_number']:
        return jsonify({'error': 'Jersey number is required'}), 400
    
    # If changing teams, ensure the new team is in the same tournament
    if 'team_id' in data:
        new_team = Team.query.get_or_404(data['team_id'])
        if new_team.tournament_id != tournament.id:
            return jsonify({'error': 'Cannot move player to a team in a different tournament'}), 400
    
    # Update fields
    if 'name' in data:
        player.name = data['name']
    if 'height' in data:
        player.height = data['height']
    if 'weight' in data:
        player.weight = data['weight']
    if 'position' in data:
        player.position = data['position']
    if 'jersey_number' in data:
        player.jersey_number = data['jersey_number']
    if 'team_id' in data:
        player.team_id = data['team_id']
    
    db.session.commit()
    
    return jsonify({'message': 'Player updated successfully'})

@main_bp.route('/api/player/<int:player_id>', methods=['DELETE'])
@login_required
def delete_player(player_id):
    """Delete a player and all associated data"""
    player = Player.query.get_or_404(player_id)
    
    # Check if user has access to the player's team's tournament
    team = Team.query.get_or_404(player.team_id)
    tournament = Tournament.query.get_or_404(team.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        db.session.begin_nested()
        
        # 1. Delete player stats
        PlayerStats.query.filter_by(player_id=player_id).delete(synchronize_session=False)
        
        # 2. Delete the player
        db.session.delete(player)
        
        db.session.commit()
        
        return jsonify({'message': 'Player deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_player: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Match Management Endpoints
@main_bp.route('/api/tournament/<int:tournament_id>/matches', methods=['GET'])
@login_required
def get_matches_for_tournament(tournament_id):
    """Get all matches for a tournament"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    matches = Match.query.filter_by(tournament_id=tournament_id).order_by(Match.match_date).all()
    
    # Create mappings for team lookups
    team_map = {team.id: team.name for team in Team.query.filter_by(tournament_id=tournament_id).all()}
    
    # Create mapping for match scores
    match_ids = [match.id for match in matches]
    scores = MatchScore.query.filter(MatchScore.match_id.in_(match_ids)).all()
    score_map = {score.match_id: score for score in scores}
    
    result = []
    for match in matches:
        score = score_map.get(match.id)
        
        match_data = {
            'id': match.id,
            'team1_id': match.team1_id,
            'team1_name': team_map.get(match.team1_id, 'Unknown'),
            'team2_id': match.team2_id,
            'team2_name': team_map.get(match.team2_id, 'Unknown'),
            'venue_name': match.venue_name,
            'match_date': match.match_date.isoformat(),
            'has_score': score is not None
        }
        
        if score:
            match_data.update({
                'team1_score': score.team1_score,
                'team2_score': score.team2_score
            })
        
        result.append(match_data)
    
    return jsonify(result)

@main_bp.route('/api/tournament/<int:tournament_id>/matches', methods=['POST'])
@login_required
def create_match(tournament_id):
    """Create a new match in a tournament"""
    tournament = Tournament.query.get_or_404(tournament_id)
    
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate required fields
    for field in ['team1_id', 'team2_id', 'match_date']:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate teams are in this tournament
    team1 = Team.query.get_or_404(data['team1_id'])
    team2 = Team.query.get_or_404(data['team2_id'])
    
    if team1.tournament_id != tournament_id or team2.tournament_id != tournament_id:
        return jsonify({'error': 'Teams must belong to this tournament'}), 400
    
    if team1.id == team2.id:
        return jsonify({'error': 'Team cannot play against itself'}), 400
    
    # Parse match date
    try:
        match_date = datetime.fromisoformat(data['match_date'])
    except ValueError:
        return jsonify({'error': 'Invalid date format'}), 400
    
    # Create match
    match = Match(
        tournament_id=tournament_id,
        team1_id=data['team1_id'],
        team2_id=data['team2_id'],
        venue_name=data.get('venue_name'),
        match_date=match_date,
        creator_id=current_user.id
    )
    
    db.session.add(match)
    db.session.flush()  # To get match id for score creation
    
    # Create score if provided
    if 'team1_score' in data and 'team2_score' in data:
        score = MatchScore(
            match_id=match.id,
            team1_score=data['team1_score'],
            team2_score=data['team2_score']
        )
        db.session.add(score)
        
        # Update team statistics (wins, losses, points)
        update_team_statistics(tournament_id)
    
    db.session.commit()
    
    return jsonify({
        'id': match.id,
        'message': 'Match created successfully'
    }), 201

@main_bp.route('/api/match/<int:match_id>', methods=['GET'])
@login_required
def get_match(match_id):
    """Get details for a specific match"""
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get score if available
    score = MatchScore.query.filter_by(match_id=match_id).first()
    
    # Get team names
    team1 = Team.query.get_or_404(match.team1_id)
    team2 = Team.query.get_or_404(match.team2_id)
    
    result = {
        'id': match.id,
        'tournament_id': match.tournament_id,
        'team1_id': match.team1_id,
        'team1_name': team1.name,
        'team2_id': match.team2_id,
        'team2_name': team2.name,
        'venue_name': match.venue_name,
        'match_date': match.match_date.isoformat(),
        'has_score': score is not None
    }
    
    if score:
        result.update({
            'team1_score': score.team1_score,
            'team2_score': score.team2_score
        })
    
    return jsonify(result)

@main_bp.route('/api/match/<int:match_id>', methods=['PUT'])
@login_required
def update_match(match_id):
    """Update match details"""
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate teams if changing
    if 'team1_id' in data or 'team2_id' in data:
        team1_id = data.get('team1_id', match.team1_id)
        team2_id = data.get('team2_id', match.team2_id)
        
        # Validate teams exist and are in this tournament
        team1 = Team.query.get_or_404(team1_id)
        team2 = Team.query.get_or_404(team2_id)
        
        if team1.tournament_id != tournament.id or team2.tournament_id != tournament.id:
            return jsonify({'error': 'Teams must belong to this tournament'}), 400
        
        if team1_id == team2_id:
            return jsonify({'error': 'Team cannot play against itself'}), 400
        
        match.team1_id = team1_id
        match.team2_id = team2_id
    
    # Update match date if provided
    if 'match_date' in data:
        try:
            match_date = datetime.fromisoformat(data['match_date'])
            match.match_date = match_date
        except ValueError:
            return jsonify({'error': 'Invalid date format'}), 400
    
    # Update venue if provided
    if 'venue_name' in data:
        match.venue_name = data['venue_name']
    
    # Handle score update
    has_score = 'team1_score' in data and 'team2_score' in data
    score = MatchScore.query.filter_by(match_id=match_id).first()
    
    if has_score:
        # Create or update score
        if score:
            score.team1_score = data['team1_score']
            score.team2_score = data['team2_score']
        else:
            score = MatchScore(
                match_id=match_id,
                team1_score=data['team1_score'],
                team2_score=data['team2_score']
            )
            db.session.add(score)
    elif 'remove_score' in data and data['remove_score'] and score:
        # Remove score if requested
        db.session.delete(score)
    
    db.session.commit()
    
    # Update team statistics if scores were changed
    if has_score or ('remove_score' in data and data['remove_score']):
        update_team_statistics(tournament.id)
    
    return jsonify({'message': 'Match updated successfully'})

@main_bp.route('/api/match/<int:match_id>', methods=['DELETE'])
@login_required
def delete_match(match_id):
    """Delete a match and all associated data"""
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        db.session.begin_nested()
        
        # 1. Delete player stats for this match
        PlayerStats.query.filter_by(match_id=match_id).delete(synchronize_session=False)
        
        # 2. Delete match score
        MatchScore.query.filter_by(match_id=match_id).delete(synchronize_session=False)
        
        # 3. Delete the match
        db.session.delete(match)
        
        db.session.commit()
        
        # Update team statistics
        update_team_statistics(tournament.id)
        
        return jsonify({'message': 'Match deleted successfully'})
    
    except Exception as e:
        db.session.rollback()
        print(f"Error in delete_match: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Player Statistics Endpoints
@main_bp.route('/api/match/<int:match_id>/stats', methods=['GET'])
@login_required
def get_stats_for_match(match_id):
    """Get all player statistics for a match"""
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get all stats for this match
    stats = PlayerStats.query.filter_by(match_id=match_id).all()
    
    # Get player ids to fetch player and team info
    player_ids = [stat.player_id for stat in stats]
    players = Player.query.filter(Player.id.in_(player_ids)).all() if player_ids else []
    
    # Create mappings for efficient lookup
    player_map = {player.id: player for player in players}
    team_ids = [player.team_id for player in players]
    team_map = {team.id: team.name for team in Team.query.filter(Team.id.in_(team_ids)).all()} if team_ids else {}
    
    result = []
    for stat in stats:
        player = player_map.get(stat.player_id)
        if not player:
            continue
        
        stat_data = {
            'id': stat.id,
            'match_id': stat.match_id,
            'player_id': stat.player_id,
            'player_name': player.name,
            'team_id': player.team_id,
            'team_name': team_map.get(player.team_id, 'Unknown'),
            'points': stat.points,
            'rebounds': stat.rebounds,
            'assists': stat.assists,
            'steals': stat.steals,
            'blocks': stat.blocks,
            'turnovers': stat.turnovers,
            'three_pointers': stat.three_pointers,
            'efficiency': stat.efficiency,
            'double_double': stat.double_double,
            'triple_double': stat.triple_double
        }
        
        result.append(stat_data)
    
    return jsonify(result)

@main_bp.route('/api/match/<int:match_id>/stats', methods=['POST'])
@login_required
def create_player_stat(match_id):
    """Create or update player statistics for a match"""
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.json
    
    # Validate required fields
    for field in ['player_id', 'points', 'rebounds', 'assists']:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if player exists and is associated with teams in this match
    player = Player.query.get_or_404(data['player_id'])
    
    # Check if player's team is playing in this match
    if player.team_id != match.team1_id and player.team_id != match.team2_id:
        return jsonify({'error': 'Player must belong to a team in this match'}), 400
    
    # Check if stats already exist for this player and match
    existing_stat = PlayerStats.query.filter_by(
        match_id=match_id,
        player_id=data['player_id']
    ).first()
    
    if existing_stat:
        # Update existing stats
        existing_stat.points = data['points']
        existing_stat.rebounds = data['rebounds']
        existing_stat.assists = data['assists']
        existing_stat.steals = data.get('steals', 0)
        existing_stat.blocks = data.get('blocks', 0)
        existing_stat.turnovers = data.get('turnovers', 0)
        existing_stat.three_pointers = data.get('three_pointers', 0)
        
        db.session.commit()
        
        return jsonify({
            'id': existing_stat.id,
            'message': 'Player statistics updated successfully'
        })
    else:
        # Create new stats
        stat = PlayerStats(
            match_id=match_id,
            player_id=data['player_id'],
            points=data['points'],
            rebounds=data['rebounds'],
            assists=data['assists'],
            steals=data.get('steals', 0),
            blocks=data.get('blocks', 0),
            turnovers=data.get('turnovers', 0),
            three_pointers=data.get('three_pointers', 0)
        )
        
        db.session.add(stat)
        db.session.commit()
        
        return jsonify({
            'id': stat.id,
            'message': 'Player statistics created successfully'
        }), 201

@main_bp.route('/api/player/<int:player_id>/stats/<int:match_id>', methods=['PUT'])
@login_required
def update_player_stats(player_id, match_id):
    """Update a player's statistics for a specific match"""
    player = Player.query.get_or_404(player_id)
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get player stats
    stats = PlayerStats.query.filter_by(
        match_id=match_id,
        player_id=player_id
    ).first()
    
    if not stats:
        return jsonify({'error': 'Statistics not found for this player and match'}), 404
    
    data = request.json
    
    # Update stats fields
    if 'points' in data:
        stats.points = data['points']
    if 'rebounds' in data:
        stats.rebounds = data['rebounds']
    if 'assists' in data:
        stats.assists = data['assists']
    if 'steals' in data:
        stats.steals = data['steals']
    if 'blocks' in data:
        stats.blocks = data['blocks']
    if 'turnovers' in data:
        stats.turnovers = data['turnovers']
    if 'three_pointers' in data:
        stats.three_pointers = data['three_pointers']
    
    db.session.commit()
    
    return jsonify({'message': 'Player statistics updated successfully'})

@main_bp.route('/api/player/<int:player_id>/stats/<int:match_id>', methods=['DELETE'])
@login_required
def delete_player_stats(player_id, match_id):
    """Delete a player's statistics for a specific match"""
    player = Player.query.get_or_404(player_id)
    match = Match.query.get_or_404(match_id)
    
    # Check if user has access to the match's tournament
    tournament = Tournament.query.get_or_404(match.tournament_id)
    if tournament.creator_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get player stats
    stats = PlayerStats.query.filter_by(
        match_id=match_id,
        player_id=player_id
    ).first()
    
    if not stats:
        return jsonify({'error': 'Statistics not found for this player and match'}), 404
    
    db.session.delete(stats)
    db.session.commit()
    
    return jsonify({'message': 'Player statistics deleted successfully'})