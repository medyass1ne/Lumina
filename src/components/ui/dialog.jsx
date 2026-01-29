"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

const DialogContext = React.createContext({});

export function Dialog({ open, onOpenChange, children }) {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            <AnimatePresence>
                {open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {children}
                    </div>
                )}
            </AnimatePresence>
        </DialogContext.Provider>
    );
}

export function DialogContent({ children, className }) {
    const { onOpenChange } = React.useContext(DialogContext);

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className={cn("relative z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden", className)}
            >
                {children}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4 text-white" />
                    <span className="sr-only">Close</span>
                </button>
            </motion.div>
        </>
    );
}
