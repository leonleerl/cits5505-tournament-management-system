# forms.py
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import (
    StringField, PasswordField, BooleanField, SubmitField, TextAreaField,
    IntegerField, DateField, SelectField, DateTimeField, HiddenField
)
from wtforms.validators import (
    DataRequired, Email, EqualTo, Length, ValidationError, 
    NumberRange, Optional
)
from datetime import datetime

# Login
class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

# Signup
class SignupForm(FlaskForm):
    fullName = StringField('Full Name', validators=[DataRequired(), Length(min=3, max=100)])
    username = StringField('Username', validators=[DataRequired(), Length(min=4, max=80)])
    email = StringField('Email', validators=[DataRequired(), Email(), Length(max=120)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    # Keep original name for backward compatibility
    confirmPassword = PasswordField('Confirm Password', validators=[
        DataRequired(), EqualTo('password', message='Passwords must match')])
    termsAgreement = BooleanField('I agree to terms', validators=[DataRequired()])
    submit = SubmitField('Create Account')

# Upload
class TournamentUploadForm(FlaskForm):
    """Form for uploading tournament Excel files"""
    file = FileField('Excel Tournament File (.xlsx)',
                    validators=[
                        FileRequired(message="Please select a file to upload."),
                        FileAllowed(['xlsx'], message="Only Excel (.xlsx) files are allowed.")
                    ])
    confirm = BooleanField('I confirm that this file follows the required format and contains all necessary data.',
                          validators=[DataRequired(message="You must confirm the file format.")])
    submit = SubmitField('Upload Tournament')

# Tournament Management
class TournamentDetailsForm(FlaskForm):
    """Form for editing tournament details"""
    tournament_id = HiddenField('Tournament ID')
    name = StringField('Tournament Name', validators=[DataRequired(), Length(min=2, max=100)])
    year = IntegerField('Year', validators=[DataRequired(), NumberRange(min=1900, max=2100)])
    description = TextAreaField('Description', validators=[Optional()])
    start_date = DateField('Start Date', validators=[DataRequired()])
    end_date = DateField('End Date', validators=[DataRequired()])
    submit = SubmitField('Save Changes')

class TeamForm(FlaskForm):
    """Form for adding or editing a team"""
    team_id = HiddenField('Team ID')
    name = StringField('Team Name', validators=[DataRequired(), Length(min=2, max=100)])
    created_year = IntegerField('Created Year', validators=[Optional(), NumberRange(min=1900, max=2100)])
    logo_shape_type = SelectField('Logo Shape', choices=[
        ('1', 'Circle'),
        ('2', 'Square'),
        ('3', 'Shield'),
        ('4', 'Star')
    ], validators=[DataRequired()])
    primary_color = StringField('Primary Color', default='#000000', validators=[DataRequired()])
    secondary_color = StringField('Secondary Color', default='#FFFFFF', validators=[DataRequired()])
    submit = SubmitField('Save Team')

class PlayerForm(FlaskForm):
    """Form for adding or editing a player"""
    player_id = HiddenField('Player ID')
    name = StringField('Player Name', validators=[DataRequired(), Length(min=2, max=100)])
    team_id = SelectField('Team', validators=[DataRequired()], coerce=int)
    position = SelectField('Position', choices=[
        ('PG', 'Point Guard (PG)'),
        ('SG', 'Shooting Guard (SG)'),
        ('SF', 'Small Forward (SF)'),
        ('PF', 'Power Forward (PF)'),
        ('C', 'Center (C)')
    ], validators=[DataRequired()])
    jersey_number = IntegerField('Jersey Number', validators=[DataRequired(), NumberRange(min=0, max=99)])
    height = IntegerField('Height (cm)', validators=[Optional(), NumberRange(min=150, max=250)])
    weight = IntegerField('Weight (kg)', validators=[Optional(), NumberRange(min=50, max=180)])
    submit = SubmitField('Save Player')

class MatchForm(FlaskForm):
    """Form for adding or editing a match"""
    match_id = HiddenField('Match ID')
    team1_id = SelectField('Team 1', validators=[DataRequired()], coerce=int)
    team2_id = SelectField('Team 2', validators=[DataRequired()], coerce=int)
    match_date = DateTimeField('Match Date & Time', validators=[DataRequired()], format='%Y-%m-%dT%H:%M')
    venue_name = StringField('Venue', validators=[Optional()])
    has_score = BooleanField('Match completed (add score)')
    team1_score = IntegerField('Team 1 Score', validators=[Optional(), NumberRange(min=0)])
    team2_score = IntegerField('Team 2 Score', validators=[Optional(), NumberRange(min=0)])
    submit = SubmitField('Save Match')

class DeleteConfirmForm(FlaskForm):
    """Form for confirming deletion"""
    item_id = HiddenField('Item ID', validators=[DataRequired()])
    item_type = HiddenField('Item Type', validators=[DataRequired()])
    submit = SubmitField('Delete')