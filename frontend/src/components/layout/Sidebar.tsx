import {
    LayoutDashboard,
    Activity,
    FileSearch,
    Users,
    Settings,
    LogOut,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/" },
    { icon: Activity, label: "Live Vitals", path: "/vitals" },
    { icon: FileSearch, label: "AI Analysis", path: "/analysis" },
    { icon: Users, label: "Patients", path: "/patients" },
    { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col h-full bg-white border-r border-slate-200", className)}>
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Activity className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-slate-900 tracking-tight">LungAI</span>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {menuItems.map((item) => (
                    <Button
                        key={item.label}
                        variant="ghost"
                        className={cn(
                            "w-full justify-start gap-3 px-4 py-6 rounded-xl transition-all duration-200",
                            item.label === "Overview"
                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                        )}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-semibold">{item.label}</span>
                        {item.label === "Overview" && (
                            <ChevronRight className="ml-auto w-4 h-4 opacity-50" />
                        )}
                    </Button>
                ))}
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-slate-50 rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">PRO PLAN</p>
                    <p className="text-sm font-medium text-slate-900 mb-3 font-poppins">Advanced Diagnostics</p>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-3">
                        <div className="bg-blue-600 h-full w-[80%]" />
                    </div>
                    <Button size="sm" className="w-full bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 rounded-lg">
                        Upgrade
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 px-4 py-3 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    onClick={() => window.location.href = '/'}
                >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Log Out</span>
                </Button>
            </div>
        </div>
    );
}
