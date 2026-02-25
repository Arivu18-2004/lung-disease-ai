import { Search, ChevronDown, Check } from "lucide-react";
import { useState } from "react";
import type { Patient } from "@/types";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PatientSelectorProps {
    patients: Patient[];
    selectedId: number | null;
    onSelect: (id: number) => void;
}

export function PatientSelector({ patients, selectedId, onSelect }: PatientSelectorProps) {
    const [open, setOpen] = useState(false);
    const selectedPatient = patients.find((p) => p.id === selectedId);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full h-14 justify-between bg-white border-slate-200 rounded-xl px-4 hover:border-blue-400 hover:bg-slate-50 transition-all text-slate-700 font-medium shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                        {selectedPatient ? (
                            <>
                                <Avatar className="h-8 w-8 border border-blue-100 flex-shrink-0">
                                    <AvatarImage src={`https://ui-avatars.com/api/?name=${selectedPatient.name}&background=eff6ff&color=3b82f6`} />
                                    <AvatarFallback>{selectedPatient.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                    <p className="text-sm font-bold truncate leading-none">{selectedPatient.name}</p>
                                    <p className="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">{selectedPatient.gender}, {selectedPatient.age} years</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                    <Search className="w-4 h-4 text-slate-400" />
                                </div>
                                <span className="text-slate-400 font-semibold truncate">Select a patient to view dashboard...</span>
                            </>
                        )}
                    </div>
                    <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl border-slate-200 shadow-2xl overflow-hidden mt-2 z-50 bg-white" align="start">
                <Command className="border-none">
                    <CommandInput placeholder="Search patient by name or ID..." className="h-14 font-semibold text-slate-700 bg-white" />
                    <CommandList className="max-h-[350px]">
                        <CommandEmpty className="p-8 text-center bg-white">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                    <Search className="w-6 h-6 text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-400">No patient found with that name.</p>
                                <Button size="sm" variant="link" className="text-blue-600 font-bold p-0">Register New Patient</Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup heading="Active Patients" className="px-2 pb-2 bg-white">
                            {patients.map((patient) => (
                                <CommandItem
                                    key={patient.id}
                                    value={patient.name}
                                    onSelect={() => {
                                        onSelect(patient.id);
                                        setOpen(false);
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer aria-selected:bg-blue-50 aria-selected:text-blue-700 mt-1 transition-colors"
                                >
                                    <Avatar className="h-10 w-10 border-2 border-slate-50">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${patient.name}&background=f8fafc&color=64748b`} />
                                        <AvatarFallback>{patient.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold leading-none">{patient.name}</p>
                                        <p className="text-xs font-medium text-slate-400 mt-1">{patient.gender} • {patient.age} years • ID: #{patient.id}</p>
                                    </div>
                                    {selectedId === patient.id && (
                                        <div className="bg-blue-600 rounded-full p-1 shadow-md shadow-blue-200">
                                            <Check className="h-3 w-3 text-white stroke-[3px]" />
                                        </div>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
