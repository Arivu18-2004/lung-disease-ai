"""
model/medical_insights.py — Clinical-grade Medical Knowledge Base
Lung Disease Detection AI System

Provides:
  - Medical descriptions & diet plans
  - Clinical risk assessment logic
  - AI interpretation templates
"""

def get_medical_advice(prediction, severity):
    """
    Returns professional medical descriptions and diet plans.
    """
    knowledge_base = {
        'COVID19': {
            'description': "Viral respiratory infection caused by SARS-CoV-2. Radiographic evidence shows ground-glass opacities and peripheral lung involvement.",
            'diet': "• High-protein diet for tissue repair.\n• Anti-inflammatory foods (garlic, turmeric).\n• Adequate hydration (2-3L/day).\n• Vitamin C and Zinc rich foods.",
            'ai_insight': "Model detected characteristic peripheral opacities consistent with viral pneumonia spikes.",
            'medication': {
                'name': "Paxlovid (Nirmatrelvir/Ritonavir) or Remdesivir",
                'dosage': "Antiviral choice depends on risk profile and symptom onset window (doctor prescribed).",
                'price': "Varies by antiviral and city pharmacy inventory.",
                'link': "https://www.1mg.com/drugs/paxzen-150mg-100mg-tablet-731320",
                'buying_note': "COVID antivirals should be started only after physician review (renal/liver/drug-interaction checks).",
                'last_updated': "Feb 2026 (India market snapshots)",
                'regimen': [
                    {
                        'phase': "Early outpatient (if prescribed)",
                        'medicine': "Paxzen (Nirmatrelvir/Ritonavir)",
                        'dose': "300/100 mg twice daily for 5 days (start early in eligible high-risk cases).",
                        'price': "Approx. ₹5,000 per 30-tablet pack",
                        'link': "https://www.1mg.com/drugs/paxzen-150mg-100mg-tablet-731320"
                    },
                    {
                        'phase': "Alternative oral antiviral (if prescribed)",
                        'medicine': "Molnunat 200 mg (Molnupiravir)",
                        'dose': "800 mg every 12 hours for 5 days (adult protocol).",
                        'price': "Approx. ₹42.23/capsule (~₹1,689 per 40 capsules)",
                        'link': "https://www.1mg.com/drugs/molnunat-200mg-capsule-707831"
                    },
                    {
                        'phase': "Symptom relief (adjunct)",
                        'medicine': "Paracetamol 650 mg",
                        'dose': "Common adult use: 1 tablet every 6-8 hours for fever (max 3 g/day unless doctor advises).",
                        'price': "Approx. ₹20-40 / strip (brand dependent)",
                        'link': "https://www.1mg.com/search/all?name=paracetamol%20650"
                    }
                ]
            }
        },
        'PNEUMONIA': {
            'description': "Acute inflammation of the lung parenchyma. X-rays show focal or multi-focal air-space consolidation and fluid accumulation.",
            'diet': "• Warm fluids (broths, herb teas).\n• Potassium-rich foods for respiratory muscle support.\n• Small, frequent, calorie-dense meals.\n• Avoid heavy dairy if mucus production is high.",
            'ai_insight': "Analysis identified dense alveolar consolidation patterns in the lower pulmonary segments.",
            'medication': {
                'name': "Amoxicillin or Azithromycin",
                'dosage': "Antibiotic selection depends on severity, age, comorbidity, and likely organism.",
                'price': "Varies by brand and duration (typically 5-10 days).",
                'link': "https://www.1mg.com/drugs/NOVAMOX-500-MG-CAPSULE-121841",
                'buying_note': "Do not self-start antibiotics. A clinician should confirm bacterial pneumonia before treatment.",
                'last_updated': "Feb 2026 (India market snapshots)",
                'regimen': [
                    {
                        'phase': "Common first-line oral option",
                        'medicine': "Novamox 500 (Amoxycillin)",
                        'dose': "Common adult regimen: 500 mg every 8 hours, typically 5-7 days (doctor may adjust).",
                        'price': "Approx. ₹110 / strip of 15 capsules",
                        'link': "https://www.1mg.com/drugs/NOVAMOX-500-MG-CAPSULE-121841"
                    },
                    {
                        'phase': "Atypical coverage option",
                        'medicine': "Azithral 500 (Azithromycin)",
                        'dose': "Common adult regimen: 500 mg once daily for 3-5 days (as prescribed).",
                        'price': "Approx. ₹114 / strip of 5 tablets",
                        'link': "https://www.1mg.com/drugs/azithral-500-tablet-325616"
                    },
                    {
                        'phase': "Alternative (case-dependent)",
                        'medicine': "Doxycycline 100 mg",
                        'dose': "Common adult regimen: 100 mg twice daily, usually 5-7 days (doctor-selected cases).",
                        'price': "Approx. ₹71.44 / strip of 8 capsules",
                        'link': "https://pharmeasy.in/online-medicine-order/doxy-1-100-capsule-8-no-s-3732755"
                    }
                ]
            }
        },
        'TUBERCULOSIS': {
            'description': "Infectious bacterial disease characterized by the growth of nodules (tubercules) in the tissues, especially the lungs.",
            'diet': "• High calorie, high protein intake to prevent weight loss.\n• Iron and Vitamin B complex supplementation.\n• Fresh fruits (oranges, amla) for immune boost.\n• Avoid tobacco and alcohol.",
            'ai_insight': "Detection focused on upper-lobe infiltrates and potential cavitary lesions typical of TB.",
            'medication': {
                'name': "First-line ATT (HRZE -> HR) for drug-susceptible TB",
                'dosage': "WHO/NTEP standard: 2 months HRZE + 4 months HR, daily, weight-based.",
                'price': "NTEP DOTS is free at government TB centers. Private pharmacy cost varies by brand.",
                'link': "https://www.1mg.com/drugs-therapeutic-classes/drug-class-120",
                'buying_note': "Prescription required. Confirm diagnosis (GeneXpert/sputum + DST) before purchase.",
                'last_updated': "Feb 2026 (India market snapshots)",
                'regimen': [
                    {
                        'phase': "Intensive phase (first 2 months)",
                        'medicine': "Forecox Tablet (HRZE FDC: H150 + R225 + Z750 + E400)",
                        'dose': "Adult dosing is weight-based; clinician decides daily tablet count.",
                        'price': "Approx. ₹103.08 / strip of 6 tablets",
                        'link': "https://www.1mg.com/drugs/forecox-tablet-125637"
                    },
                    {
                        'phase': "Alternative HRZE option",
                        'medicine': "Akurit 4 Tablet (HRZE FDC)",
                        'dose': "Use only under TB specialist guidance and weight band protocol.",
                        'price': "Approx. ₹86.2 / strip of 10 tablets",
                        'link': "https://www.1mg.com/drugs/akurit-4-tablet-147003"
                    },
                    {
                        'phase': "Continuation phase (next 4 months)",
                        'medicine': "R-Cinex 600 Tablet (HR FDC: R600 + H300)",
                        'dose': "Common adult band: 300 mg INH + 600 mg RIF daily (doctor-adjusted).",
                        'price': "Approx. ₹49.78 / strip of 3 tablets",
                        'link': "https://www.1mg.com/drugs/r-cinex-600-tablet-274076"
                    },
                    {
                        'phase': "Neuropathy prophylaxis (adjunct)",
                        'medicine': "Vitamin B6 (Pyridoxine, e.g., Benadon 40 mg)",
                        'dose': "Usually 25-50 mg/day with isoniazid (as prescribed).",
                        'price': "Approx. ₹41.6 / strip of 15 tablets",
                        'link': "https://www.1mg.com/otc/benadon-40mg-for-immunity-mood-regulation-protein-breakdown-tablet-otc869983"
                    }
                ]
            }
        },
        'NORMAL': {
            'description': "No significant radiographic abnormalities detected. Lung fields are clear, and cardiac silhouette is within normal limits.",
            'diet': "• Maintain a balanced diet (plate method).\n• Regular cardiovascular exercise.\n• Adequate sleep (7-9 hours).\n• Annual health screenings.",
            'ai_insight': "Model confirmed clear pulmonary parenchyma and healthy airway distribution.",
            'medication': None
        }
    }

    entry = knowledge_base.get(prediction.upper(), knowledge_base['NORMAL'])
    
    # Adjust description by severity if applicable
    if severity and severity != 'N/A' and prediction != 'NORMAL':
        entry['description'] = f"[{severity} CASE] " + entry['description']

    return entry

def compute_clinical_risk(prediction, confidence, severity, spo2=None):
    """
    Computes clinical risk level based on model output and vitals.
    Returns: { 'level': str, 'color': str }
    """
    if prediction.upper() == 'NORMAL':
        return {'level': 'Stable', 'color': 'success', 'class': 'state-normal'}
    
    # Base score
    score = 0
    if severity == 'Severe': score += 40
    elif severity == 'Moderate': score += 20
    else: score += 10
    
    # Confidence weight
    score += (confidence * 0.4)
    
    # SpO2 weight (Critical factor)
    if spo2:
        if spo2 < 85: score += 50
        elif spo2 < 92: score += 30
    
    if score >= 80:
        return {'level': 'Critical', 'color': 'danger', 'class': 'risk-critical'}
    elif score >= 50:
        return {'level': 'Severe', 'color': 'orange', 'class': 'risk-severe'}
    elif score >= 30:
        return {'level': 'Moderate', 'color': 'warning', 'class': 'risk-moderate'}
    else:
        return {'level': 'Mild', 'color': 'info', 'class': 'risk-mild'}
