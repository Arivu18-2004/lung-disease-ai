import axios from 'axios';
import type { Patient, Vitals, XRayReport, DashboardStats } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
    baseURL: API_BASE_URL,
});

export const dashboardService = {
    getPatients: async (): Promise<Patient[]> => {
        const response = await api.get('/api/patients');
        return response.data.patients;
    },

    getPatientVitals: async (patientId: number): Promise<{ patient: Patient; latest: Vitals | null; vitals: Vitals[] }> => {
        const response = await api.get(`/api/vitals/${patientId}`);
        return response.data;
    },

    getPatientXrays: async (patientId: number): Promise<XRayReport[]> => {
        const response = await api.get(`/api/xray-reports/${patientId}`);
        return response.data.reports;
    },

    getDashboardStats: async (): Promise<DashboardStats> => {
        const response = await api.get('/api/stats');
        return response.data;
    },

    createPatient: async (patient: Omit<Patient, 'id'>): Promise<Patient> => {
        const response = await api.post('/api/patients', patient);
        return response.data.patient;
    },

    predictXray: async (patientId: number, file: File): Promise<any> => {
        const formData = new FormData();
        formData.append('patient_id', patientId.toString());
        formData.append('xray', file);
        const response = await api.post('/api/xray/predict', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
