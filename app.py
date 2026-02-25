"""
app.py — Main Flask Application
Lung Disease Detection AI System

Routes:
  GET  /              → Upload form (index.html)
  POST /predict       → Process X-ray + run CNN → result.html
  GET  /dashboard     → Patient vitals + X-ray history
  POST /patient/add   → Add new patient
  GET  /patient/<id>  → Patient detail page
  GET  /api/*         → IoT endpoints (see iot/api.py)
"""
import os
import uuid
from datetime import datetime
from flask import (Flask, render_template, request, redirect,
                   url_for, flash, jsonify, send_from_directory, session)
from flask_cors import CORS
from flask_migrate import Migrate
from werkzeug.utils import secure_filename

import secrets
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from authlib.integrations.flask_client import OAuth

from config import config
from database.models import db, Patient, XRayReport, Vitals, User
from iot.api import iot_bp
from model.predict import predict_xray, generate_gradcam
from model.report_generator import generate_medical_report
from model.medical_insights import get_medical_advice, compute_clinical_risk
from flask import send_file

# ── App Factory ───────────────────────────────────────────────────────────────
def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    CORS(app)  # Enable CORS for all routes

    # Initialize Google OAuth
    oauth = OAuth(app)
    google = oauth.register(
        name='google',
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={
            'scope': 'openid email profile'
        }
    )

    # Ensure upload / heatmap folders exist
    os.makedirs(app.config['UPLOAD_FOLDER'],  exist_ok=True)
    os.makedirs(app.config['HEATMAP_FOLDER'], exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Security headers for production
    if not app.debug:
        from flask_talisman import Talisman
        # Note: adjust content_security_policy if using external assets
        Talisman(app, content_security_policy=None) 
    
    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Register IoT Blueprint
    app.register_blueprint(iot_bp)

    # ─────────────────────────────────────────────────────────────────────────
    # Helpers
    # ─────────────────────────────────────────────────────────────────────────
    def allowed_file(filename):
        return ('.' in filename and
                filename.rsplit('.', 1)[1].lower()
                in app.config['ALLOWED_EXTENSIONS'])

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Product Page
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/product')
    def product():
        """Premium SaaS Product Landing Page"""
        return render_template('product.html')

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Technology Page
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/technology')
    def technology():
        """Deep Dive into LungAI Technology"""
        return render_template('technology.html')

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Home / Upload
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/')
    def index():
        """Landing page with X-ray upload form and patient registration."""
        patients = Patient.query.order_by(Patient.name).all()
        return render_template('index.html', patients=patients)

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Add Patient
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/patient/add', methods=['POST'])
    def add_patient():
        """Register a new patient and redirect back to the upload page."""
        name   = request.form.get('name', '').strip()
        age    = request.form.get('age', 0)
        gender = request.form.get('gender', '')

        if not name or not age or not gender:
            flash('All patient fields are required.', 'error')
            return redirect(url_for('index'))

        try:
            age = int(age)
        except ValueError:
            flash('Age must be a number.', 'error')
            return redirect(url_for('index'))

        patient = Patient(name=name, age=age, gender=gender)
        db.session.add(patient)
        db.session.commit()
        flash(f'Patient "{name}" registered successfully! (ID: {patient.id})', 'success')
        return redirect(url_for('index'))

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Predict (POST)
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/predict', methods=['POST'])
    def predict():
        """
        1. Validate uploaded X-ray file
        2. Save file securely
        3. Run CNN prediction
        4. Generate Grad-CAM heatmap
        5. Save XRayReport to DB
        6. Render result page
        """
        # --- Patient selection / quick-add ---
        patient_id = request.form.get('patient_id')
        quick_name = request.form.get('quick_name', '').strip()

        if patient_id:
            patient = Patient.query.get(patient_id)
            if not patient:
                flash('Selected patient not found.', 'error')
                return redirect(url_for('index'))
        elif quick_name:
            # Quick add patient without full registration
            age    = request.form.get('quick_age', 0)
            gender = request.form.get('quick_gender', 'Unknown')
            try:
                age = int(age)
            except ValueError:
                age = 0
            patient = Patient(name=quick_name, age=age, gender=gender)
            db.session.add(patient)
            db.session.flush()  # Get ID without committing
        else:
            flash('Please select or enter a patient.', 'error')
            return redirect(url_for('index'))

        # --- File validation ---
        if 'xray' not in request.files:
            flash('No file selected.', 'error')
            return redirect(url_for('index'))

        file = request.files['xray']
        if file.filename == '':
            flash('No file selected.', 'error')
            return redirect(url_for('index'))

        if not allowed_file(file.filename):
            flash('Invalid file type. Please upload PNG, JPG, or JPEG.', 'error')
            return redirect(url_for('index'))

        # --- Save uploaded file ---
        ext       = file.filename.rsplit('.', 1)[1].lower()
        filename  = f"{uuid.uuid4().hex}.{ext}"
        save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)
        relative_image = f"uploads/{filename}"

        # --- CNN Prediction ---
        result = predict_xray(save_path)

        # --- Grad-CAM Heatmap ---
        heatmap_relative = None
        heatmap_filename = f"heatmap_{filename}"
        heatmap_path     = os.path.join(app.config['HEATMAP_FOLDER'], heatmap_filename)
        cam_result       = generate_gradcam(save_path, heatmap_path)
        if cam_result:
            heatmap_relative = f"heatmaps/{heatmap_filename}"

        # --- Save report to DB ---
        report = XRayReport(
            patient_id   = patient.id,
            image_path   = relative_image,
            prediction   = result['prediction'],
            confidence   = result['confidence'],
            severity     = result['severity'],
            heatmap_path = heatmap_relative
        )
        db.session.add(report)
        db.session.commit()

        return render_template(
            'result.html',
            patient    = patient,
            report     = report,
            result     = result,
            medical_info = result['medical_info'],
            risk       = result['risk'],
            probabilities = result['probabilities'],
            heatmap    = heatmap_relative,
            demo_mode  = result.get('demo_mode', False)
        )

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Download Report (PDF)
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/download-report/<int:report_id>')
    def download_report(report_id):
        report = XRayReport.query.get_or_404(report_id)
        patient = Patient.query.get(report.patient_id)
        
        # Re-derive insights (ideally these should be in DB, but for demo we re-compute)
        advice = get_medical_advice(report.prediction, report.severity)
        risk = compute_clinical_risk(report.prediction, report.confidence * 100, report.severity)
        
        report_data = {
            'report': report,
            'patient': patient,
            'medical_info': advice,
            'risk': risk
        }
        
        pdfs_dir = os.path.join(app.static_folder, 'reports')
        os.makedirs(pdfs_dir, exist_ok=True)
        pdf_path = os.path.join(pdfs_dir, f"Report_{report.id}.pdf")
        
        generate_medical_report(report_data, pdf_path)
        return send_file(pdf_path, as_attachment=True)

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Simulated Vitals (For IoT Dashboard)
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/api/simulated-vitals/<int:patient_id>')
    def simulated_vitals(patient_id):
        import random
        
        # Verify patient exists
        patient = Patient.query.get(patient_id)
        if not patient:
            return jsonify({'error': 'Patient not found'}), 404
            
        # Simulate realistic medical vitals
        hr = random.randint(72, 105)
        spo2 = random.randint(91, 99)
        temp = round(random.uniform(36.5, 38.5), 1)
        rr = random.randint(14, 24)
        
        # Save to database
        new_vitals = Vitals(
            patient_id=patient_id,
            spo2=spo2,
            temperature=temp,
            heart_rate=hr,
            device_id='SIMULATOR_V3'
        )
        db.session.add(new_vitals)
        db.session.commit()
        
        data = {
            'heart_rate': hr,
            'spo2': spo2,
            'temperature': temp,
            'respiratory_rate': rr,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        }
        return jsonify(data)

    # ─────────────────────────────────────────────────────────────────────────
    # Route: Dashboard
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/dashboard')
    def dashboard():
        return redirect("/doctor")

    # ─────────────────────────────────────────────────────────────────────────
    # Error Handlers
    # ─────────────────────────────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return render_template('404.html'), 404

    @app.errorhandler(413)
    def file_too_large(e):
        flash('File too large. Maximum upload size is 16 MB.', 'error')
        return redirect(url_for('index'))

    @app.errorhandler(500)
    def server_error(e):
        return render_template('500.html'), 500

    # ─────────────────────────────────────────────────────────────────────────
    # Auth Routes (Email/Password & Google)
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/login/google')
    def login_google():
        if not os.environ.get("GOOGLE_CLIENT_ID") or os.environ.get("GOOGLE_CLIENT_ID") == 'your-google-client-id':
            flash("Google Authentication is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the .env file.", "error")
            return redirect(url_for('login'))
        
        role = request.args.get('role')
        if role:
            session['oauth_role'] = role
            
        redirect_uri = url_for('authorize_google', _external=True)
        return google.authorize_redirect(redirect_uri)

    @app.route('/auth/google/callback')
    def authorize_google():
        try:
            token = google.authorize_access_token()
            user_info = token.get('userinfo')
        except Exception as e:
            flash(f"Google authentication failed. Please ensure credentials are correct.", "error")
            return redirect(url_for('login'))
            
        if user_info:
            email = user_info['email']
            name = user_info.get('name', 'Google User')
            
            user = User.query.filter_by(email=email).first()
            if user:
                login_user(user)
                flash('Logged in successfully via Google.', 'success')
                return redirect('/doctor' if user.role == 'doctor' else f'/patient/{user.patient_id}')
            else:
                role = session.get('oauth_role', 'patient') 
                
                random_password = secrets.token_urlsafe(16)
                
                new_user = User(email=email, role=role)
                new_user.set_password(random_password)
                
                if role == 'patient':
                    patient = Patient(name=name, age=0, gender='Unknown')
                    db.session.add(patient)
                    db.session.flush()
                    new_user.patient_id = patient.id
                    
                db.session.add(new_user)
                db.session.commit()
                
                login_user(new_user)
                flash('Registered successfully via Google!', 'success')
                return redirect('/doctor' if role == 'doctor' else f'/patient/{new_user.patient_id}')
                
        flash('Failed to authenticate with Google.', 'error')
        return redirect(url_for('login'))

    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            if current_user.role == 'doctor':
                return redirect(url_for('portal_routes'))
            else:
                return redirect(url_for('portal_routes', id=current_user.patient_id))
                
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                login_user(user)
                flash('Logged in successfully.', 'success')
                if user.role == 'doctor':
                    return redirect('/doctor')
                elif user.role == 'patient':
                    return redirect(f'/patient/{user.patient_id}')
            else:
                flash('Invalid email or password.', 'error')
                
        return render_template('login.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            if current_user.role == 'doctor':
                return redirect('/doctor')
            else:
                return redirect(f'/patient/{current_user.patient_id}')
                
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            role = request.form.get('role')
            
            if User.query.filter_by(email=email).first():
                flash('Email already exists. Please login.', 'error')
                return redirect(url_for('register'))
                
            user = User(email=email, role=role)
            user.set_password(password)
            
            # If patient, create a simple patient record linked
            if role == 'patient':
                name = request.form.get('name', 'New Patient')
                patient = Patient(name=name, age=0, gender='Unknown')
                db.session.add(patient)
                db.session.flush()
                user.patient_id = patient.id
                
            db.session.add(user)
            db.session.commit()
            
            login_user(user)
            flash('Registration successful!', 'success')
            
            if role == 'doctor':
                return redirect('/doctor')
            else:
                return redirect(f'/patient/{user.patient_id}')
                
        return render_template('register.html')
        
    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('You have been logged out.', 'info')
        return redirect(url_for('index'))

    # ─────────────────────────────────────────────────────────────────────────
    # React Portal Routes
    # ─────────────────────────────────────────────────────────────────────────
    @app.route('/doctor')
    @app.route('/patient/<path:id>')
    @login_required
    def portal_routes(id=None):
        """Serve the React portal for doctor and patient routes."""
        return send_from_directory(os.path.join(app.root_path, 'static/fe_assets'), 'index.html')

    @app.route('/assets/<path:path>')
    def serve_fe_assets(path):
        """Serve React build assets."""
        return send_from_directory(os.path.join(app.root_path, 'static/fe_assets/assets'), path)

    return app


# ── Entry Point ───────────────────────────────────────────────────────────────
app = create_app('development')

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Create tables if migrations not yet run
    app.run(debug=True, host='0.0.0.0', port=5001)
