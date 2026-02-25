import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { dashboardService } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2 } from "lucide-react";

interface AddPatientModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AddPatientModal({ open, onOpenChange }: AddPatientModalProps) {
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("Male");
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: () => dashboardService.createPatient({
            name,
            age: parseInt(age),
            gender,
            created_at: new Date().toISOString()
        } as any),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            onOpenChange(false);
            setName("");
            setAge("");
            setGender("Male");
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl">
                <DialogHeader>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <DialogTitle className="text-2xl font-black font-poppins">Register New Patient</DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium">
                        Create a new profile to track vitals and diagnostic history.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Arivu Selvam"
                            className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Age</label>
                            <Input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Age"
                                className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                            <Select value={gender} onValueChange={setGender}>
                                <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50 focus:bg-white transition-all font-medium">
                                    <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100">
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            {mutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Register Patient"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
