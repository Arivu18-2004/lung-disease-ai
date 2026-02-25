import os
import sys

# Add the project root to the path so we can import 'app' flatly
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from app import create_app
from database.models import db

# Initialize the Flask app in development mode
# This will pick up the DATABASE_URL from .env
app = create_app('development')

if __name__ == '__main__':
    with app.app_context():
        print("Connecting to Supabase Database...")
        print(f"DATABASE_URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Create all tables defined in models.py
        db.create_all()
        print("Successfully created tables in Supabase: users, patients, xray_reports, vitals")
