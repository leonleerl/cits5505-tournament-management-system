from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_wtf.csrf import CSRFProtect

# Create blueprint with a unique name 'auth' instead of 'main'
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    """Login route."""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        # In a real app, you would validate credentials here
        
        flash('Login functionality will be implemented soon.', 'info')
        return redirect(url_for('main.index'))
        
    return render_template('login.html')

@auth_bp.route('/signup', methods=['GET', 'POST'])
def signup():
    """Signup route."""
    if request.method == 'POST':
        # Process signup form
        flash('Account created successfully! You can now log in.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('signup.html')

@auth_bp.route('/dashboard')
def dashboard():
    """Dashboard route."""
    # In a real app, you would check if user is logged in here
    return render_template('dashboard.html')