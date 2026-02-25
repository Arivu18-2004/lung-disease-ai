import { dashboardService } from "@/services/api";
import type { DashboardStats, Patient, XRayReport } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export function useDashboard() {
    const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

    const statsQuery = useQuery<DashboardStats>({
        queryKey: ['stats'],
        queryFn: dashboardService.getDashboardStats,
        refetchInterval: 30000,
    });

    const patientsQuery = useQuery<Patient[]>({
        queryKey: ['patients'],
        queryFn: dashboardService.getPatients,
    });

    const patientVitalsQuery = useQuery({
        queryKey: ['vitals', selectedPatientId],
        queryFn: () => selectedPatientId ? dashboardService.getPatientVitals(selectedPatientId) : null,
        enabled: !!selectedPatientId,
        refetchInterval: 10000, // Real-time polling
    });

    const patientXraysQuery = useQuery<XRayReport[]>({
        queryKey: ['xrays', selectedPatientId],
        queryFn: () => selectedPatientId ? dashboardService.getPatientXrays(selectedPatientId) : [],
        enabled: !!selectedPatientId,
    });

    return {
        stats: statsQuery.data,
        patients: patientsQuery.data || [],
        selectedPatient: patientVitalsQuery.data?.patient,
        vitals: patientVitalsQuery.data?.vitals || [],
        latestVitals: patientVitalsQuery.data?.latest,
        xrayReports: patientXraysQuery.data || [],
        isLoading: patientsQuery.isLoading || statsQuery.isLoading,
        selectedPatientId,
        setSelectedPatientId,
    };
}
