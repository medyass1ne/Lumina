"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Folder, Zap, Save, Loader2 } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import DriveFolderManagerModal from "./DriveFolderManagerModal";

export default function ListenerSettingsModal({ isOpen, onClose, settings, templates, onSave }) {
    const [localSettings, setLocalSettings] = useState({
        isEnabled: false,
        folderId: null,
        folderName: null,
        templateId: "",
        scale: 2
    });
    const [showFolderManager, setShowFolderManager] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && settings) {
            setLocalSettings({
                isEnabled: settings.isEnabled || false,
                folderId: settings.folderId || null,
                folderName: settings.folderName || null,
                templateId: settings.templateId || (templates[0]?.id || ""),
                scale: settings.scale || 2
            });
        }
    }, [isOpen, settings, templates]);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(localSettings);
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            >
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Zap size={18} className="text-yellow-400" />
                        Listener Configuration
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white"><X size={20} /></button>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-sm font-medium text-white">Enable Auto-Processing</span>
                        <div
                            onClick={() => setLocalSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                            className={cn(
                                "w-12 h-6 rounded-full p-1 cursor-pointer transition-colors relative",
                                localSettings.isEnabled ? "bg-green-500" : "bg-white/20"
                            )}
                        >
                            <div className={cn(
                                "w-4 h-4 rounded-full bg-white transition-transform",
                                localSettings.isEnabled ? "translate-x-6" : "translate-x-0"
                            )} />
                        </div>
                    </div>

                    {/* Folder Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-white/50 uppercase">Watch Folder</label>
                        <button
                            onClick={() => setShowFolderManager(true)}
                            className="w-full p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors text-left"
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Folder size={18} className="text-blue-400 shrink-0" />
                                <span className={cn("truncate text-sm", localSettings.folderName ? "text-white" : "text-white/50")}>
                                    {localSettings.folderName || "Select a folder..."}
                                </span>
                            </div>
                            <span className="text-xs text-blue-300">Change</span>
                        </button>
                    </div>

                    {/* Template Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-white/50 uppercase">Apply Template</label>
                        <select
                            value={localSettings.templateId}
                            onChange={(e) => setLocalSettings(prev => ({ ...prev, templateId: e.target.value }))}
                            className="w-full p-3 bg-[#0a0a0a] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="" disabled>Select a template</option>
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name} ({t.aspectRatio})</option>
                            ))}
                        </select>
                    </div>

                    {/* Scale Selection */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-white/50 uppercase">Output Scale</label>
                        <div className="flex items-center gap-4">
                            {[1, 2, 4].map(s => (
                                <button
                                    key={s}
                                    onClick={() => setLocalSettings(prev => ({ ...prev, scale: s }))}
                                    className={cn(
                                        "flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                                        localSettings.scale === s
                                            ? "bg-blue-600 border-blue-500 text-white"
                                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                                    )}
                                >
                                    {s}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/10 bg-[#0a0a0a] flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm text-white/50 hover:text-white">Cancel</button>
                    <GlassButton onClick={handleSave} disabled={isSaving || !localSettings.folderId || !localSettings.templateId} className="bg-green-600 hover:bg-green-500 pl-4 pr-6">
                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                        Save Configuration
                    </GlassButton>
                </div>
            </motion.div>

            {/* Nested Folder Manager */}
            <DriveFolderManagerModal
                isOpen={showFolderManager}
                onClose={() => setShowFolderManager(false)}
                onSelect={(folder) => {
                    setLocalSettings(prev => ({ ...prev, folderId: folder.id, folderName: folder.name }));
                    setShowFolderManager(false);
                }}
            />
        </div>
    );
}
