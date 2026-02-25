import { Bell, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
            <div className="flex items-center gap-8 flex-1 max-w-2xl">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="Search patients, reports, or data..."
                        className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500 transition-all shadow-sm w-full"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full border border-emerald-100 mr-2">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider">System Live</span>
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                </div>

                <Button variant="ghost" size="icon" className="text-slate-500 relative bg-slate-50 hover:bg-slate-100 rounded-full w-10 h-10">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </Button>

                <div className="h-8 w-[1px] bg-slate-200 mx-2" />

                <div className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">Dr. Sarah Johnson</p>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest leading-none mt-1">Senior Radiologist</p>
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md group-hover:scale-105 transition-transform">
                        <AvatarImage src="https://ui-avatars.com/api/?name=Sarah+Johnson&background=0284c7&color=fff" />
                        <AvatarFallback>SJ</AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
