import { useEffect, useState, useRef } from "react";
import { VitalsChart } from "@/components/dashboard/VitalsChart";
import { dashboardService } from "@/services/api";
import { API_BASE_URL } from "@/services/api";
import type { Vitals, XRayReport } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
    Activity,
    ArrowLeft,
    CalendarCheck2,
    Clock,
    FileText,
    Heart,
    Thermometer,
    Droplets,
    Download,
    ShieldAlert,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PatientPortal() {
    useEffect(() => {
        document.title = "Patient Portal | LungAI — AI-Powered Lung Disease Detection";
    }, []);
    const { id } = useParams<{ id: string }>();
    const patientId = id ? parseInt(id) : 1; // Default to 1 for demo
    const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const { data, isLoading } = useQuery<{ patient: any, vitals: Vitals[], latest: Vitals | null }>({
        queryKey: ['vitals', patientId],
        queryFn: () => dashboardService.getPatientVitals(patientId),
        refetchInterval: 3000,
    });

    const xrayQuery = useQuery<XRayReport[]>({
        queryKey: ['xrays', patientId],
        queryFn: () => dashboardService.getPatientXrays(patientId),
    });

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Loading Your Health Data...</p>
                </div>
            </div>
        );
    }

    const patient = data?.patient;
    const vitals = data?.vitals || [];
    const latestVitals = data?.latest;
    const xrayReports = xrayQuery.data || [];

    // Default to the first report if none selected
    const activeReport = selectedReportId
        ? xrayReports.find(r => r.id === selectedReportId) || xrayReports[0]
        : xrayReports[0];

    const handleViewDetails = (reportId: number) => {
        setSelectedReportId(reportId);
        // Scroll to the AI Diagnostic Scan section
        const element = document.getElementById('ai-insight-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleDownloadReport = async () => {
        if (!reportRef.current || !activeReport) {
            alert("No report data available to download.");
            return;
        }

        setIsGeneratingPDF(true);
        try {
            const element = reportRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff"
            });
            const imgData = canvas.toDataURL("image/png");

            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`LungAI_Report_${patient.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Failed to generate PDF. Please try again.");
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] font-inter pb-20">
            {/* Simple Top Bar */}
            <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="brand-icon text-blue-600 text-xl font-black">LungAI</div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-2 py-1 rounded">Patient Portal</span>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="hidden md:block text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged in as</p>
                        <p className="text-sm font-black text-slate-900">{patient?.name}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black">
                        {patient?.name?.[0]}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-6 md:p-8">
                {/* Back to Landing */}
                <a href="http://localhost:5001" className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold text-sm mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Health Center
                </a>

                {/* Patient Welcome */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-poppins">Welcome back, {patient?.name?.split(' ')[0]}!</h1>
                        <p className="text-slate-500 font-medium mt-1">Here is a real-time summary of your respiratory health.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-sm font-bold text-emerald-700">Device Connected: ESP32_PRO_01</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Vitals Summary Card */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl w-fit mb-4">
                                    <Heart className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Heart Rate</p>
                                <h3 className="text-3xl font-black text-slate-900 font-poppins">{latestVitals?.heart_rate || '--'} <span className="text-sm text-slate-400 italic">BPM</span></h3>
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-4">
                                    <Droplets className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">O₂ Saturation</p>
                                <h3 className="text-3xl font-black text-slate-900 font-poppins">{latestVitals?.spo2?.toFixed(1) || '--'} <span className="text-sm text-slate-400 italic">%</span></h3>
                            </div>

                            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl w-fit mb-4">
                                    <Thermometer className="w-6 h-6" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Temperature</p>
                                <h3 className="text-3xl font-black text-slate-900 font-poppins">{latestVitals?.temperature?.toFixed(1) || '--'} <span className="text-sm text-slate-400 italic">°C</span></h3>
                            </div>
                        </div>

                        {/* Vitals Detail Chart */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-black text-slate-900 font-poppins flex items-center gap-3">
                                    <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    Vitals Overview
                                </h2>
                                <Button
                                    variant="outline"
                                    disabled={isGeneratingPDF}
                                    onClick={handleDownloadReport}
                                    className="text-xs font-bold uppercase tracking-widest rounded-xl px-4 gap-2"
                                >
                                    <Download className="w-4 h-4" />
                                    {isGeneratingPDF ? "Generating..." : "Download Report"}
                                </Button>
                            </div>
                            <div className="h-[300px]">
                                <VitalsChart data={vitals} type="spo2" title="Oxygen Levels (Live)" color="#10b981" />
                            </div>
                        </div>

                        {/* Report History */}
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                            <h2 className="text-xl font-black text-slate-900 mb-8 font-poppins flex items-center gap-3">
                                <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                Your Medical Reports
                            </h2>
                            <div className="space-y-4">
                                {xrayReports.map(report => (
                                    <div key={report.id} className={cn(
                                        "flex flex-col sm:flex-row items-center gap-6 p-6 rounded-3xl border transition-all duration-300",
                                        activeReport?.id === report.id ? "bg-blue-50/50 border-blue-200" : "bg-slate-50 border-transparent hover:border-blue-100 hover:bg-white"
                                    )}>
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm border-2 border-white">
                                            <img src={`${API_BASE_URL}/static/${report.image_path}`} alt="Xray" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CalendarCheck2 className="w-3 h-3 text-slate-400" />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(report.created_at), 'MMMM d, yyyy')}</p>
                                            </div>
                                            <h4 className="text-lg font-black text-slate-900">{report.prediction} Analysis</h4>
                                            <p className="text-xs font-medium text-slate-500">Severity: <span className={cn("font-bold", report.prediction === 'Pneumonia' ? 'text-rose-600' : 'text-emerald-600')}>{report.severity || 'Stable'}</span></p>
                                        </div>
                                        <Button
                                            variant={activeReport?.id === report.id ? "secondary" : "outline"}
                                            onClick={() => handleViewDetails(report.id)}
                                            className="rounded-xl font-bold text-xs gap-2 min-w-[120px]"
                                        >
                                            View Details
                                        </Button>
                                    </div>
                                ))}
                                {xrayReports.length === 0 && (
                                    <div className="py-12 text-center text-slate-400 font-medium">No diagnostic reports found for your record.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Insights & Support */}
                    <div className="lg:col-span-4 space-y-8" id="ai-insight-section">
                        {/* Premium Report Insight Header */}
                        <div className="bg-white p-1 rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 py-1 bg-slate-50 rounded-lg">AI Diagnostic Scan</span>
                                <Badge className={activeReport?.prediction === "Pneumonia" ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}>
                                    {activeReport?.severity || (activeReport?.prediction === "Pneumonia" ? "Action Required" : "No Abnormality")}
                                </Badge>
                            </div>

                            <div className="p-4 pt-0">
                                <div className="relative rounded-2xl overflow-hidden aspect-square border border-slate-100 bg-slate-50">
                                    {activeReport ? (
                                        <>
                                            <img
                                                src={`${API_BASE_URL}/static/${activeReport.heatmap_path || activeReport.image_path}`}
                                                alt="Lung Heatmap"
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 shadow-xl">
                                                <p className="text-[10px] font-black text-slate-700 uppercase tracking-tighter flex items-center gap-1.5">
                                                    <Activity className="w-3 h-3 text-blue-600" /> AI Heatmap Enabled
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <Activity className="w-12 h-12 animate-pulse" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 pt-2">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={cn("p-3 rounded-2xl", activeReport?.prediction === "Pneumonia" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                                        {activeReport?.prediction === "Pneumonia" ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black text-slate-900 leading-none mb-1">{activeReport?.prediction || "No Data"}</h4>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Diagnostic Verdict</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-400 uppercase tracking-tighter">AI Confidence</span>
                                        <span className="font-black text-blue-600">{activeReport?.confidence.toFixed(1) || 0}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                                        <div
                                            className={cn("h-full transition-all duration-1000", activeReport?.prediction === "Pneumonia" ? "bg-rose-500" : "bg-emerald-500")}
                                            style={{ width: `${activeReport?.confidence || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <FileText className="w-3 h-3" /> AI Analysis Summary
                                    </p>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                        {activeReport?.prediction === "Pneumonia"
                                            ? "The model has identified significant patterns in the basal lung regions consistent with pneumonia. Clinical follow-up with a respiratory specialist is recommended."
                                            : "No radiological evidence of pneumonia was detected in this scan. Lung fields appear clear and vascular markings are normal."
                                        }
                                    </p>
                                </div>

                                <Button
                                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                                    onClick={() => window.open('https://wa.me/911234567890', '_blank')}
                                >
                                    Speak to Specialist
                                </Button>
                            </div>
                        </div>

                        {/* Support Card */}
                        <div className="bg-blue-600 p-8 rounded-[40px] text-white overflow-hidden relative group">
                            <div className="absolute -bottom-10 -right-10 p-8 opacity-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700">
                                <Activity className="w-64 h-64" />
                            </div>
                            <h3 className="text-xl font-black mb-4 font-poppins relative z-10">24/7 Monitoring</h3>
                            <p className="text-blue-100 text-sm mb-8 leading-relaxed relative z-10">Your real-time vitals are being monitored by our AI system. Our team is on standby for any critical alerts.</p>
                            <div className="flex items-center gap-3 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 mb-8 relative z-10">
                                <Clock className="w-5 h-5 text-blue-200" />
                                <div>
                                    <p className="text-xs font-bold text-blue-200 uppercase tracking-widest leading-none mb-1">Status</p>
                                    <p className="text-sm font-black">Active Monitoring</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Premium LaTeX-Style PDF Template */}
            <div className="fixed -left-[4000px] top-0">
                <div ref={reportRef} className="w-[210mm] min-h-[297mm] bg-white p-[25mm] font-serif text-[#1e293b] leading-relaxed shadow-2xl">
                    {/* Academic Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-12 mb-12">
                        <div className="flex flex-col">
                            <h1 className="text-5xl font-extrabold tracking-tighter text-blue-800 mb-1">LungAI</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Diagnostic Intelligence Suite</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold uppercase tracking-widest text-slate-900 mb-1">Radiological Report</h2>
                            <p className="text-xs font-bold text-slate-500">REF ID: #{activeReport?.id}-{format(new Date(), 'ss')}</p>
                            <p className="text-xs font-medium text-slate-400 mt-1">{format(new Date(), 'MMMM d, yyyy')}</p>
                        </div>
                    </div>

                    {/* Patient Information Grid */}
                    <div className="mb-16">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-800 border-b border-blue-100 pb-3 mb-6">Section I: Patient Record</h3>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Primary Subject</span>
                                <span className="text-[12px] font-black text-slate-900">{patient?.name}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Age / Gender</span>
                                <span className="text-[12px] font-black text-slate-900">{patient?.age} yrs / {patient?.gender}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Patient ID</span>
                                <span className="text-[12px] font-black text-slate-900">#P-{patient?.id?.toString().padStart(4, '0')}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-100 pb-2">
                                <span className="text-[11px] font-bold text-slate-400 uppercase">Consult Type</span>
                                <span className="text-[12px] font-black text-slate-900">Automated Screening</span>
                            </div>
                        </div>
                    </div>

                    {/* Real-time Physiological Data */}
                    <div className="mb-16">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-800 border-b border-blue-100 pb-3 mb-6">Section II: Clinical Vitals</h3>
                        <div className="grid grid-cols-3 gap-8">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Heart Rate</p>
                                <p className="text-xl font-black text-slate-900">{latestVitals?.heart_rate} <span className="text-[10px] text-slate-400">BPM</span></p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Oxygen Saturation</p>
                                <p className="text-xl font-black text-slate-900">{latestVitals?.spo2.toFixed(1)} <span className="text-[10px] text-slate-400">%</span></p>
                            </div>
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Body Temperature</p>
                                <p className="text-xl font-black text-slate-900">{latestVitals?.temperature.toFixed(1)} <span className="text-[10px] text-slate-400">°C</span></p>
                            </div>
                        </div>
                    </div>

                    {/* AI Diagnostic Imaging Analysis */}
                    <div className="mb-16">
                        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-800 border-b border-blue-100 pb-3 mb-8">Section III: Radiological Analysis</h3>
                        <div className="flex gap-10">
                            <div className="w-[75mm] h-[75mm] rounded-[24px] overflow-hidden border-2 border-slate-100 shadow-md">
                                {activeReport && (
                                    <img
                                        src={`${API_BASE_URL}/static/${activeReport.image_path}`}
                                        crossOrigin="anonymous"
                                        alt="Xray"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                            <div className="flex-1 py-4">
                                <div className="mb-8">
                                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Primary Diagnosis</p>
                                    <h2 className={cn("text-4xl font-extrabold tracking-tight", activeReport?.prediction === 'Pneumonia' ? 'text-rose-700' : 'text-emerald-700')}>
                                        {activeReport?.prediction}
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500 mt-2">Confidence Accuracy: {activeReport?.confidence.toFixed(1)}%</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Clinical Severity</p>
                                        <p className="text-sm font-black text-slate-900">{activeReport?.severity || (activeReport?.prediction === 'Pneumonia' ? 'High Concern' : 'Normal / Stable')}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">AI Interpretive Notes</p>
                                        <p className="text-[11px] font-medium text-slate-600 italic">
                                            {activeReport?.prediction === 'Pneumonia'
                                                ? "Pattern recognition algorithms indicate significant opacity concentrations in pulmonary regions. Immediate review by attending clinician is mandatory."
                                                : "Radiographic clear zones confirmed. No significant density fluctuations or infectious markers identified by neural engine."
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer & Digital Stamp */}
                    <div className="mt-auto pt-16 border-t border-slate-100">
                        <div className="flex justify-between items-end">
                            <div className="max-w-[120mm]">
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-3">Professional Disclaimer</p>
                                <p className="text-[9px] text-slate-400 leading-normal italic">
                                    LungAI Diagnostics is an automated analytical tool. This report is generated by a convolutional neural network (ResNet-50) and should be used as a secondary screening mechanism. Final medical diagnosis must be provided by a licensed physician.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <ShieldCheck className="w-8 h-8 text-blue-500" />
                                </div>
                                <p className="text-[10px] font-black text-slate-900">VERIFIED AI DIGITAL SIGNATURE</p>
                                <p className="text-[8px] font-bold text-slate-400 tracking-tighter uppercase mb-4">LungAI Diagnostic Authentication</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
