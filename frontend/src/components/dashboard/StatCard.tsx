import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend: string;
    trendType: "up" | "down" | "neutral";
    color: string;
    className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendType, color, className }: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden group border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 border-none bg-white", className)}>
            <div className="p-6 relative">
                <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-[0.03] -translate-y-8 translate-x-8 rounded-full transition-transform group-hover:scale-125 duration-700", color)} />

                <div className="flex justify-between items-start mb-4">
                    <div className={cn("p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300", color)}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>

                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-inter",
                        trendType === "up" ? "bg-emerald-50 text-emerald-600" :
                            trendType === "down" ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-600"
                    )}>
                        {trendType === "up" ? <TrendingUp className="w-3.5 h-3.5" /> :
                            trendType === "down" ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                        {trend}
                    </div>
                </div>

                <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight font-poppins">{value}</h3>
                </div>
            </div>
        </Card>
    );
}
