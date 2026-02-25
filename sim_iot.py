import requests
import time
import random

# API endpoint
API_URL = "http://localhost:5001/api/vitals"

# Patient ID (Default to 1 as per implementation plan)
PATIENT_ID = 1
DEVICE_ID = "ESP32_PRO_01"

print(f"🚀 Starting IoT Simulation for Patient ID: {PATIENT_ID}")
print(f"📡 Sending data to {API_URL} every 3 seconds...")

while True:
    try:
        # Base values from user request
        # 89 BPM, 97.7% O2, 37.1 °C
        
        heart_rate = int(random.gauss(89, 2))      # Normal fluctuation
        spo2 = round(random.gauss(97.7, 0.5), 1)   # Normal fluctuation
        temperature = round(random.gauss(37.1, 0.2), 1)
        
        # Ensure values stay within bounds
        spo2 = min(100.0, max(0.0, spo2))
        
        data = {
            "device_id": DEVICE_ID,
            "patient_id": PATIENT_ID,
            "spo2": spo2,
            "temperature": temperature,
            "heart_rate": heart_rate
        }
        
        response = requests.post(API_URL, json=data)
        
        if response.status_code == 201:
            print(f"✅ [{time.strftime('%H:%M:%S')}] SENT: HR={heart_rate} BPM | SpO2={spo2}% | Temp={temperature}°C")
        else:
            print(f"❌ [{time.strftime('%H:%M:%S')}] ERROR: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"⚠️ Simulation Error: {e}")
        
    time.sleep(3)
