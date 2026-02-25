import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { PatientSelector } from "@/components/dashboard/PatientSelector";
import { VitalsChart } from "@/components/dashboard/VitalsChart";
import { AnalysisResult } from "@/components/dashboard/AnalysisResult";
import { useDashboard } from "@/hooks/useDashboard";
import { API_BASE_URL } from "@/services/api";
import {
    Users,
    FileText,
    Activity,
    Database,
    ArrowRight,
    Plus,
    ShieldAlert,
    CalendarCheck2,
    Zap,
    UserPlus
} from "lucide-react";
import { AddPatientModal } from "@/components/dashboard/AddPatientModal";
import { NewAnalysisModal } from "@/components/dashboard/NewAnalysisModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
export default function DashboardPage() {
    useEffect(() => {
        document.title = "Doctor Portal | LungAI — AI-Powered Lung Disease Detection";
    }, []);

    const {
        stats,
        patients,
        selectedPatientId,
        setSelectedPatientId,
        vitals,
        xrayReports,
    } = useDashboard();

    const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
    const [isNewAnalysisOpen, setIsNewAnalysisOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
            <Sidebar className="w-80 hidden lg:flex" />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header />

                <main className="flex-1 overflow-y-auto p-8 pt-6 relative">
                    {/* Animated Background Gradients */}
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-[120px] -z-10" />

                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CalendarCheck2 className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-bold text-blue-600 uppercase tracking-widest leading-none mt-0.5">Clinical Dashboard</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight font-poppins">System Overview</h1>
                            <p className="text-slate-500 font-medium mt-1">Hospital data & AI diagnostics in real-time.</p>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setIsNewAnalysisOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 h-12 shadow-lg shadow-blue-200 gap-2 transition-all hover:scale-105 active:scale-95 group"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                New Analysis Report
                            </Button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <StatCard
                            title="Total Patients"
                            value={stats?.total_patients || 0}
                            icon={Users}
                            trend="+12% vs LY"
                            trendType="up"
                            color="bg-blue-600"
                        />
                        <StatCard
                            title="X-Ray Reports"
                            value={stats?.total_reports || 0}
                            icon={FileText}
                            trend="+5% week"
                            trendType="up"
                            color="bg-indigo-500"
                        />
                        <StatCard
                            title="Pneumonia Cases"
                            value={stats?.pneumonia_count || 0}
                            icon={ShieldAlert}
                            trend="-2% today"
                            trendType="down"
                            color="bg-rose-500"
                        />
                        <StatCard
                            title="Active Devices"
                            value={stats?.active_devices || 0}
                            icon={Database}
                            trend="Stable"
                            trendType="neutral"
                            color="bg-emerald-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Context Selection & Vitals */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                                    <Activity className="w-48 h-48 text-blue-600" />
                                </div>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-black text-slate-900 font-poppins flex items-center gap-3 m-0">
                                        <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                        Patient Management
                                    </h2>
                                    <Button
                                        onClick={() => setIsAddPatientOpen(true)}
                                        variant="outline"
                                        className="rounded-xl font-bold text-xs gap-2 border-slate-200 hover:bg-slate-50"
                                    >
                                        <UserPlus className="w-4 h-4" /> Add Patient
                                    </Button>
                                </div>
                                <PatientSelector
                                    patients={patients}
                                    selectedId={selectedPatientId}
                                    onSelect={setSelectedPatientId}
                                />
                            </div>

                            {selectedPatientId && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                                    <VitalsChart
                                        data={vitals}
                                        type="heart_rate"
                                        title="Heart Rate"
                                        color="#0ea5e9"
                                    />
                                    <VitalsChart
                                        data={vitals}
                                        type="spo2"
                                        title="O₂ Saturation"
                                        color="#10b981"
                                    />
                                    <VitalsChart
                                        data={vitals}
                                        type="temperature"
                                        title="Body Temperature"
                                        color="#8b5cf6"
                                    />
                                </div>
                            )}

                            {selectedPatientId && (
                                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                        <h2 className="text-xl font-black text-slate-900 font-poppins flex items-center gap-3">
                                            <span className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                            Detailed History
                                        </h2>
                                        <div className="flex gap-2">
                                            <a href={`/patient/${selectedPatientId}`} target="_blank" rel="noreferrer">
                                                <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 rounded-lg h-9 hover:bg-emerald-100">Patient View</Button>
                                            </a>
                                            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-slate-500 rounded-lg h-9">Export PDF</Button>
                                            <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 rounded-lg h-9">Complete History</Button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {xrayReports.slice(0, 3).map((report) => (
                                            <div key={report.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-slate-50 rounded-3xl group hover:bg-blue-50/50 transition-colors duration-300 border border-transparent hover:border-blue-100">
                                                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                                                    <img src={`${API_BASE_URL}/static/${report.image_path}`} alt="X-ray" className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex-1 text-center sm:text-left">
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Diagnostic #{report.id}</p>
                                                    <h4 className="text-lg font-black text-slate-900 font-poppins">{report.prediction} <span className="text-blue-600 ml-1">{(report.confidence).toFixed(1)}%</span></h4>
                                                    <p className="text-xs font-medium text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                                                        <CalendarCheck2 className="w-3 h-3 text-slate-400" />
                                                        {format(new Date(report.created_at), 'MMMM d, yyyy')} • severity: {report.severity || 'Stable'}
                                                    </p>
                                                </div>
                                                <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14 bg-white border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                                                    <ArrowRight className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        ))}
                                        {xrayReports.length === 0 && (
                                            <div className="p-12 text-center">
                                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">No reports available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: AI Analysis & Alerts */}
                        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-right-4 duration-1000">
                            <div className="h-[420px]">
                                <AnalysisResult report={xrayReports[0] || null} />
                            </div>

                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-black text-slate-900 font-poppins flex items-center gap-3">
                                        <span className="w-1.5 h-6 bg-rose-500 rounded-full" />
                                        Security Alerts
                                    </h2>
                                    <Badge className="bg-rose-500 text-white border-none font-black px-2 py-0.5">3</Badge>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: "Critical SpO2 Drop", time: "2m ago", color: "bg-rose-500" },
                                        { label: "Low Heart Rate", time: "15m ago", color: "bg-amber-500" },
                                        { label: "Device Disconnected", time: "1h ago", color: "bg-slate-400" },
                                    ].map((alert, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 cursor-pointer group transition-colors">
                                            <div className={cn("w-3 h-3 rounded-full animate-pulse", alert.color)} />
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-none">{alert.label}</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{alert.time}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                                                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="link" className="w-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 mt-2">Clear notifications</Button>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                                    <Zap className="w-32 h-32" />
                                </div>
                                <h3 className="text-xl font-black mb-2 font-poppins">Technical Support</h3>
                                <p className="text-indigo-100/80 text-sm font-medium mb-6">Need help with device configuration or AI results?</p>
                                <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl h-12">Contact Agent</Button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            <AddPatientModal
                open={isAddPatientOpen}
                onOpenChange={setIsAddPatientOpen}
            />

            <NewAnalysisModal
                open={isNewAnalysisOpen}
                onOpenChange={setIsNewAnalysisOpen}
                patients={patients}
                defaultPatientId={selectedPatientId || undefined}
            />
        </div>
    );
}
