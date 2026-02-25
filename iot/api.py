"""
iot/api.py — IoT REST API Blueprint
Lung Disease Detection AI System

Handles incoming data from ESP32/STM32 devices.
Stores vitals and fires emergency alerts when SpO2 < 90%.

ESP32 POST example:
  POST /api/vitals
  {
    "device_id": "ESP32_01",
    "patient_id": 1,
    "spo2": 95,
    "temperature": 36.8,
    "heart_rate": 78
  }
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from database.models import db, Vitals, Patient, XRayReport

# Create Blueprint with '/api' URL prefix
iot_bp = Blueprint('iot', __name__, url_prefix='/api')


@iot_bp.route('/vitals', methods=['POST'])
def receive_vitals():
    """
    Receive and store IoT vitals from ESP32/STM32 device.
    Returns emergency alert if SpO2 < 90.
    """
    data = request.get_json()

    # --- Validate required fields ---
    required = ['device_id', 'patient_id', 'spo2', 'temperature', 'heart_rate']
    for field in required:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400

    # --- Validate patient exists ---
    patient = Patient.query.get(data['patient_id'])
    if not patient:
        return jsonify({'error': f"Patient id={data['patient_id']} not found"}), 404

    # --- Validate vital ranges ---
    spo2        = float(data['spo2'])
    temperature = float(data['temperature'])
    heart_rate  = int(data['heart_rate'])

    if not (0 <= spo2 <= 100):
        return jsonify({'error': 'SpO2 must be between 0 and 100'}), 400
    if not (30 <= temperature <= 45):
        return jsonify({'error': 'Temperature must be between 30°C and 45°C'}), 400
    if not (20 <= heart_rate <= 300):
        return jsonify({'error': 'Heart rate must be between 20 and 300 BPM'}), 400

    # --- Save vitals to database ---
    vitals = Vitals(
        patient_id  = data['patient_id'],
        spo2        = spo2,
        temperature = temperature,
        heart_rate  = heart_rate,
        device_id   = data.get('device_id', 'UNKNOWN'),
        recorded_at = datetime.utcnow()
    )
    db.session.add(vitals)
    db.session.commit()

    # --- Emergency alert logic ---
    alert   = spo2 < 90
    message = None
    if alert:
        message = (
            f"🚨 EMERGENCY: Low SpO2 detected! "
            f"Patient: {patient.name} | SpO2: {spo2}% | "
            f"Device: {data.get('device_id')} | "
            f"Time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC"
        )

    response = {
        'status':      'success',
        'vitals_id':   vitals.id,
        'patient':     patient.name,
        'alert':       alert,
        'message':     message,
        'recorded_at': vitals.recorded_at.isoformat()
    }
    return jsonify(response), 201


@iot_bp.route('/vitals/<int:patient_id>', methods=['GET'])
def get_patient_vitals(patient_id):
    """
    Retrieve the latest 10 vitals readings for a given patient.
    Used by dashboard for AJAX polling.
    """
    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    vitals = (Vitals.query
              .filter_by(patient_id=patient_id)
              .order_by(Vitals.recorded_at.desc())
              .limit(10)
              .all())

    return jsonify({
        'patient':   patient.to_dict(),
        'vitals':    [v.to_dict() for v in vitals],
        'latest':    vitals[0].to_dict() if vitals else None
    })


@iot_bp.route('/patients', methods=['GET'])
def list_patients():
    """
    Returns all patients — useful for ESP32 device configuration.
    """
    patients = Patient.query.order_by(Patient.name).all()
    return jsonify({'patients': [p.to_dict() for p in patients]})


@iot_bp.route('/patients', methods=['POST'])
def add_patient_api():
    """
    Register a new patient via JSON.
    """
    data = request.get_json()
    name   = data.get('name', '').strip()
    age    = data.get('age')
    gender = data.get('gender', '')

    if not name or age is None or not gender:
        return jsonify({'error': 'Missing required patient fields'}), 400

    try:
        age = int(age)
    except ValueError:
        return jsonify({'error': 'Age must be a number'}), 400

    patient = Patient(name=name, age=age, gender=gender)
    db.session.add(patient)
    db.session.commit()
    return jsonify({
        'status': 'success',
        'patient': patient.to_dict()
    }), 201


@iot_bp.route('/vitals/all', methods=['GET'])
def get_all_recent_vitals():
    """
    Returns the 20 most recent vitals across all patients.
    Includes emergency flag.
    """
    vitals = (Vitals.query
              .order_by(Vitals.recorded_at.desc())
              .limit(20)
              .all())
    return jsonify({'vitals': [v.to_dict() for v in vitals]})


@iot_bp.route('/stats', methods=['GET'])
def get_stats():
    """
    Returns global system statistics.
    """
    total_patients = Patient.query.count()
    total_reports  = XRayReport.query.count()
    pneumonia_count = XRayReport.query.filter_by(prediction='Pneumonia').count()
    active_devices  = (db.session.query(Vitals.device_id)
                       .distinct().count())

    return jsonify({
        'total_patients':  total_patients,
        'total_reports':   total_reports,
        'pneumonia_count': pneumonia_count,
        'active_devices':  active_devices
    })


@iot_bp.route('/xray-reports/<int:patient_id>', methods=['GET'])
def get_patient_xrays(patient_id):
    """
    Returns all X-ray reports for a given patient.
    """
    reports = (XRayReport.query
               .filter_by(patient_id=patient_id)
               .order_by(XRayReport.created_at.desc())
               .all())
    return jsonify({'reports': [r.to_dict() for r in reports]})


@iot_bp.route('/xray/predict', methods=['POST'])
def predict_api():
    """
    Upload an X-ray via FormData and get AI prediction.
    """
    import os
    import uuid
    from flask import current_app
    from model.predict import predict_xray, generate_gradcam

    patient_id = request.form.get('patient_id')
    if not patient_id:
        return jsonify({'error': 'patient_id is required'}), 400

    patient = Patient.query.get(patient_id)
    if not patient:
        return jsonify({'error': 'Patient not found'}), 404

    if 'xray' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400

    file = request.files['xray']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    # Save file
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    relative_image = f"uploads/{filename}"

    # Prediction
    result = predict_xray(save_path)

    # Heatmap
    heatmap_relative = None
    heatmap_filename = f"heatmap_{filename}"
    heatmap_path = os.path.join(current_app.config['HEATMAP_FOLDER'], heatmap_filename)
    cam_result = generate_gradcam(save_path, heatmap_path)
    if cam_result:
        heatmap_relative = f"heatmaps/{heatmap_filename}"

    # Save report
    report = XRayReport(
        patient_id=patient.id,
        image_path=relative_image,
        prediction=result['prediction'],
        confidence=result['confidence'],
        severity=result['severity'],
        heatmap_path=heatmap_relative
    )
    db.session.add(report)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'report': report.to_dict(),
        'result': result,
        'heatmap': heatmap_relative
    }), 201

