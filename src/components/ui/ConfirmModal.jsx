"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    type = "warning"
}) {
    const icons = {
        warning: <AlertCircle className="text-yellow-400" size={24} />,
        danger: <AlertCircle className="text-red-400" size={24} />,
        info: <Info className="text-blue-400" size={24} />,
        success: <CheckCircle className="text-green-400" size={24} />
    };

    const buttonColors = {
        warning: "bg-yellow-600 hover:bg-yellow-500",
        danger: "bg-red-600 hover:bg-red-500",
        info: "bg-blue-600 hover:bg-blue-500",
        success: "bg-green-600 hover:bg-green-500"
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative z-50 bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    {icons[type]}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                                    <p className="text-white/70 text-sm">{message}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="flex-shrink-0 text-white/40 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={cn(
                                        "flex-1 px-4 py-2.5 rounded-lg text-white font-medium transition-colors",
                                        buttonColors[type]
                                    )}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Alert-only modal (no confirmation needed)
export function AlertModal({
    isOpen,
    onClose,
    title,
    message,
    type = "info",
    buttonText = "OK"
}) {
    const icons = {
        warning: <AlertCircle className="text-yellow-400" size={24} />,
        danger: <AlertCircle className="text-red-400" size={24} />,
        info: <Info className="text-blue-400" size={24} />,
        success: <CheckCircle className="text-green-400" size={24} />
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative z-50 bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    {icons[type]}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                                    <p className="text-white/70 text-sm">{message}</p>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                                >
                                    {buttonText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
