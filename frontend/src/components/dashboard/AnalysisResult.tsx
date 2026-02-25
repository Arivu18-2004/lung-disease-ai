import type { XRayReport } from "@/types";
import { API_BASE_URL } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ShieldAlert, ShieldCheck, Clock, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface AnalysisResultProps {
    report: XRayReport | null;
}

export function AnalysisResult({ report }: AnalysisResultProps) {
    if (!report) {
        return (
            <Card className="h-full border-none shadow-sm bg-white border-dashed border-2 border-slate-100 flex items-center justify-center p-8 text-center">
                <div className="flex flex-col items-center gap-4 max-w-[240px]">
                    <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-slate-200" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">No Analysis Yet</p>
                        <p className="text-sm font-medium text-slate-400">Complete an X-ray upload to see AI diagnostic results.</p>
                    </div>
                </div>
            </Card>
        );
    }

    const isPositive = report.prediction === "Pneumonia";

    return (
        <Card className="h-full border-none shadow-sm bg-white overflow-hidden group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-6 pb-2 border-b border-slate-50">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-widest">Latest AI Insight</CardTitle>
                    <Badge className={isPositive ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}>
                        {report.severity || (isPositive ? 'Critical Attention' : 'Normal State')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex gap-6 items-start">
                    <div className="relative w-48 aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                        <img
                            src={`${API_BASE_URL}/static/${report.heatmap_path || report.image_path}`}
                            alt="Lung Analysis"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" /> View Heatmap
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className={isPositive ? "text-rose-600 bg-rose-50 p-2 rounded-xl" : "text-emerald-600 bg-emerald-50 p-2 rounded-xl"}>
                                {isPositive ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                            </div>
                            <div>
                                <h4 className="text-2xl font-black text-slate-900 font-poppins">{report.prediction}</h4>
                                <p className="text-xs font-bold text-slate-400 tracking-wide">Confidence Score: <span className="text-blue-600">{(report.confidence).toFixed(1)}%</span></p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Generated On</span>
                            </div>
                            <p className="text-sm font-bold text-slate-900 tracking-tight">{format(new Date(report.created_at), 'MMMM do, yyyy • HH:mm')}</p>
                        </div>

                        <div className="pt-2">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2 shadow-inner">
                                <div
                                    className={isPositive ? "h-full bg-rose-500" : "h-full bg-emerald-500"}
                                    style={{ width: `${report.confidence}%` }}
                                />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest leading-none">AI Accuracy metric</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
