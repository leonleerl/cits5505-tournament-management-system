from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user, login_required, current_user
from app.models.models import User
from app.models.database import db
from app.forms.forms import SignupForm, LoginForm


# Create blueprint with a unique name 'auth'
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    form = SignupForm()
    if form.validate_on_submit():
        full_name = form.fullName.data.strip()
        username = form.username.data.strip()
        email = form.email.data.strip()
        password = form.password.data

        existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
        if existing_user:
            if existing_user.username == username:
                flash("Username already exists.", "danger")
            else:
                flash("Email already registered.", "danger")
            return redirect(url_for('auth.signup'))

        new_user = User(username=username, email=email, full_name=full_name)
        new_user.set_password(password)

        db.session.add(new_user)
        db.session.commit()
        flash("Account created successfully! You can now log in.", "success")
        return redirect(url_for('auth.login'))
    return render_template('signup.html', form=form)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    form = LoginForm()  
    if form.validate_on_submit():
        username = form.username.data.strip()
        password = form.password.data

        user = User.query.filter_by(username=username).first()

        if user and user.check_password(password):
            login_user(user, remember=form.remember.data)
            flash("Logged in successfully!", "success")
            return redirect(url_for('main.index'))
        else:
            flash("Invalid username or password.", "danger")

    return render_template('login.html', form=form)  

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('main.index'))

@auth_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')
