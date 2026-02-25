"""
config.py — Application Configuration
Lung Disease Detection AI System
"""
import os
from dotenv import load_dotenv

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))


class Config:
    # Flask secret key for sessions
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        if os.environ.get('FLASK_ENV') == 'production':
            raise ValueError("No SECRET_KEY set for production environment")
        SECRET_KEY = 'lung-ai-dev-key'

    # Database URI
    _db_url = os.environ.get('DATABASE_URL')
    if _db_url and _db_url.startswith("postgres://"):
        _db_url = _db_url.replace("postgres://", "postgresql://", 1)
    
    SQLALCHEMY_DATABASE_URI = _db_url or ('sqlite:///' + os.path.join(BASE_DIR, 'lung_disease.db'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # File upload settings
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    HEATMAP_FOLDER = os.path.join(BASE_DIR, 'static', 'heatmaps')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'bmp', 'webp'}

    # Model path
    MODEL_PATH = os.path.join(BASE_DIR, 'model', 'lung_model_multi.h5')

    # IoT settings
    IOT_ALERT_SPO2_THRESHOLD = 90


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False
    # In production, we might want to use a different static folder or other settings
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
