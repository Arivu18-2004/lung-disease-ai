"""
database/models.py — SQLAlchemy Database Models
Lung Disease Detection AI System

Tables:
  - patients      : Patient records
  - xray_reports  : AI prediction results per X-ray
  - vitals        : IoT device readings (ESP32/STM32)
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

# SQLAlchemy instance (imported into app.py)
db = SQLAlchemy()

class User(UserMixin, db.Model):
    """
    User account for authentication (both doctor and patient).
    """
    __tablename__ = 'users'
    
    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role          = db.Column(db.String(20), nullable=False) # 'doctor' or 'patient'
    patient_id    = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True) # If role is 'patient'
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Patient(db.Model):
    """
    Stores patient demographic information.
    One patient can have many X-ray reports and vitals records.
    """
    __tablename__ = 'patients'

    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(120), nullable=False)
    age        = db.Column(db.Integer, nullable=False)
    gender     = db.Column(db.String(10), nullable=False)  # Male / Female / Other
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    xray_reports = db.relationship('XRayReport', backref='patient', lazy=True,
                                   cascade='all, delete-orphan')
    vitals       = db.relationship('Vitals', backref='patient', lazy=True,
                                   cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Patient id={self.id} name={self.name}>'

    def to_dict(self):
        return {
            'id':         self.id,
            'name':       self.name,
            'age':        self.age,
            'gender':     self.gender,
            'created_at': self.created_at.isoformat()
        }


class XRayReport(db.Model):
    """
    Stores CNN model predictions for each X-ray upload.
    Linked to a specific patient.
    """
    __tablename__ = 'xray_reports'

    id          = db.Column(db.Integer, primary_key=True)
    patient_id  = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    image_path  = db.Column(db.String(255), nullable=False)   # Relative path under static/
    prediction  = db.Column(db.String(50), nullable=False)    # 'Normal' or 'Pneumonia'
    confidence  = db.Column(db.Float, nullable=False)         # e.g. 0.93 (93%)
    severity    = db.Column(db.String(20), nullable=True)     # 'Mild' / 'Moderate' / 'Severe'
    heatmap_path = db.Column(db.String(255), nullable=True)   # Grad-CAM heatmap path
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<XRayReport id={self.id} patient_id={self.patient_id} prediction={self.prediction}>'

    def to_dict(self):
        return {
            'id':           self.id,
            'patient_id':   self.patient_id,
            'image_path':   self.image_path,
            'prediction':   self.prediction,
            'confidence':   round(self.confidence * 100, 2),
            'severity':     self.severity,
            'heatmap_path': self.heatmap_path,
            'created_at':   self.created_at.isoformat()
        }


class Vitals(db.Model):
    """
    IoT device readings sent by ESP32/STM32.
    Stores SpO2, temperature, heart rate per patient.
    """
    __tablename__ = 'vitals'

    id          = db.Column(db.Integer, primary_key=True)
    patient_id  = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    spo2        = db.Column(db.Float, nullable=False)         # Oxygen saturation (%)
    temperature = db.Column(db.Float, nullable=False)         # Body temperature (°C)
    heart_rate  = db.Column(db.Integer, nullable=False)       # BPM
    device_id   = db.Column(db.String(50), nullable=True)     # e.g. 'ESP32_01'
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return (f'<Vitals id={self.id} patient_id={self.patient_id} '
                f'spo2={self.spo2} hr={self.heart_rate}>')

    def to_dict(self):
        return {
            'id':          self.id,
            'patient_id':  self.patient_id,
            'spo2':        self.spo2,
            'temperature': self.temperature,
            'heart_rate':  self.heart_rate,
            'device_id':   self.device_id,
            'recorded_at': self.recorded_at.isoformat(),
            'alert':       self.spo2 < 90  # Emergency flag
        }
