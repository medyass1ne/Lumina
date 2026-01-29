"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { Monitor, Smartphone, Printer, Box } from "lucide-react";

export function ResolutionControl({ scale, onChange }) {

    const OPTIONS = [
        { value: 1, label: "Web Fast", desc: "1x Scale", icon: <Monitor size={16} /> },
        { value: 2, label: "Social HD", desc: "2x Scale", icon: <Smartphone size={16} /> },
        { value: 4, label: "Print Ready", desc: "4x Scale", icon: <Printer size={16} /> },
    ];

    return (
        <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/10">
            {OPTIONS.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex flex-col items-center justify-center px-4 py-2 rounded-md transition-all duration-200 min-w-[90px]",
                        scale === opt.value
                            ? "bg-white/10 text-white shadow-lg border border-white/20"
                            : "text-white/40 hover:text-white/70 hover:bg-white/5"
                    )}
                >
                    <div className="flex items-center gap-2 mb-0.5">
                        {opt.icon}
                        <span className="font-bold text-xs">{opt.label}</span>
                    </div>
                    <span className="text-[10px] opacity-50">{opt.desc}</span>
                </button>
            ))}
        </div>
    );
}
