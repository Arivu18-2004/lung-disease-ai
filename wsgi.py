from app import create_app
import os

# Determine which config to use based on environment variable
env = os.environ.get('FLASK_ENV', 'production')
app = create_app(env)

if __name__ == "__main__":
    app.run()
