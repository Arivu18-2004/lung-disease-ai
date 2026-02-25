# Lung Disease Detection AI Platform

An advanced medical diagnostic suite integrating Deep Learning CNNs with IoT telematics for real-time respiratory monitoring.

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Python 3.9+**
- **Node.js & npm** (for TypeScript compilation)

### 2. Backend Setup (Python)
Ideally, use a virtual environment to manage dependencies:

```bash
# Create virtual environment
python3 -m venv venv

# Activate venv
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup (TypeScript)
The project uses TypeScript for core UI animations. You need to compile `.ts` files to `.js` before running:

```bash
# Install node dependencies
npm install

# Compile TypeScript once
npx tsc

# Or watch for changes
npx tsc --watch
```

### 4. Running the Application
Once the environment is ready and TypeScript is compiled:

```bash
python3 app.py
```
The application will be available at **http://127.0.0.1:5001**.

---

## 🛠 Project Structure
- `app.py`: Main Flask entry point.
- `static/ts/`: Source TypeScript files for product and home animations.
- `model/`: AI implementation (TensorFlow/Keras).
- `database/`: SQLAlchemey models.
- `iot/`: RESTful API for hardware telemetry ingestion.
- `templates/`: HTML5/Bootstrap interface.
