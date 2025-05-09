# forms.py
from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, PasswordField, BooleanField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=4)])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=8)])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

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