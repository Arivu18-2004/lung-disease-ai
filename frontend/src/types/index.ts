export interface Patient {
    id: number;
    name: string;
    age: number;
    gender: string;
    created_at: string;
}

export interface Vitals {
    id: number;
    patient_id: number;
    spo2: number;
    temperature: number;
    heart_rate: number;
    device_id: string;
    recorded_at: string;
    alert: boolean;
}

export interface XRayReport {
    id: number;
    patient_id: number;
    image_path: string;
    prediction: string;
    confidence: number;
    severity: string;
    heatmap_path: string | null;
    created_at: string;
}

export interface DashboardStats {
    total_patients: number;
    total_reports: number;
    pneumonia_count: number;
    active_devices: number;
}
