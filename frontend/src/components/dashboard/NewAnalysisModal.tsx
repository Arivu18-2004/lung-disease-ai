import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { dashboardService } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Loader2, FileImage, X, CheckCircle2 } from "lucide-react";
import type { Patient } from "@/types";
import { cn } from "@/lib/utils";

interface NewAnalysisModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    patients: Patient[];
    defaultPatientId?: number;
}

export function NewAnalysisModal({ open, onOpenChange, patients, defaultPatientId }: NewAnalysisModalProps) {
    const [selectedPatientId, setSelectedPatientId] = useState<number | undefined>(defaultPatientId);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => {
            if (!selectedPatientId || !file) throw new Error("Missing selection");
            return dashboardService.predictXray(selectedPatientId, file);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['xrays', selectedPatientId] });
            onOpenChange(false);
            setFile(null);
            setPreview(null);
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] rounded-[40px] border-none shadow-2xl p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        <DialogHeader>
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                                <Upload className="w-6 h-6" />
                            </div>
                            <DialogTitle className="text-2xl font-black font-poppins">New AI Analysis</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Upload a chest X-ray to run our deep learning diagnostic engine.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6 mt-8">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Select Patient</label>
                                <div className="grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-1">
                                    {patients.map((p) => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPatientId(p.id)}
                                            className={cn(
                                                "px-4 py-3 rounded-xl text-sm font-bold transition-all border text-left flex items-center justify-between group",
                                                selectedPatientId === p.id
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                                                    : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-200"
                                            )}
                                        >
                                            {p.name}
                                            {selectedPatientId === p.id && <CheckCircle2 className="w-4 h-4" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">X-ray Image</label>
                                {!preview ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-200 rounded-[32px] p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                                    >
                                        <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                                            <FileImage className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">Click to upload X-ray</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                                    </div>
                                ) : (
                                    <div className="relative rounded-[32px] overflow-hidden border border-slate-100 aspect-video bg-slate-50">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => { setFile(null); setPreview(null); }}
                                            className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-all"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 px-8 flex gap-3 mt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 h-12 rounded-xl font-bold text-slate-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={mutation.isPending || !file || !selectedPatientId}
                            className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:grayscale"
                        >
                            {mutation.isPending ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing AI...</span>
                                </div>
                            ) : (
                                "Run Diagnostic"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
