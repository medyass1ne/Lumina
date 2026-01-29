"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X, Settings, Zap, Shield, Database, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { signOut } from "next-auth/react";

export function SettingsModal({ isOpen, onClose }) {
    const { projects } = useStore();
    const [activeTab, setActiveTab] = useState("general");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const tabs = [
        { id: "general", label: "General", icon: Settings },
        { id: "advanced", label: "Advanced", icon: Zap },
        { id: "data", label: "Data & Privacy", icon: Database },
    ];

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
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
                        className="relative z-50 bg-[#111] border border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                                        <Settings className="text-pink-400" size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Settings</h2>
                                        <p className="text-white/50 text-sm">Customize your experience</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-white/40 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-2 mt-6">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                                                activeTab === tab.id
                                                    ? "bg-pink-500/20 text-pink-200 border border-pink-500/30"
                                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <Icon size={16} />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {activeTab === "general" && <GeneralSettings />}
                            {activeTab === "advanced" && <AdvancedSettings />}
                            {activeTab === "data" && <DataSettings projects={projects} onClose={onClose} />}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center">
                            <p className="text-xs text-white/40">Version 1.0.0</p>
                            <button
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

function GeneralSettings() {
    const { userSettings, updateUserSettings } = useStore();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">General Preferences</h3>

                <div className="space-y-4">
                    {/* Notifications */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                            <p className="font-medium text-white">Enable Notifications</p>
                            <p className="text-sm text-white/50">Get notified when processing completes</p>
                        </div>
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={userSettings.notifications}
                                onChange={(e) => updateUserSettings({ notifications: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                    </div>

                    {/* Default Quality */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <label className="block">
                            <p className="font-medium text-white mb-2">Default Output Quality</p>
                            <p className="text-sm text-white/50 mb-3">Choose the default resolution scale for processing</p>
                            <select
                                value={userSettings.defaultQuality}
                                onChange={(e) => updateUserSettings({ defaultQuality: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-pink-500 outline-none"
                            >
                                <option value="1" className="bg-[#111]">Web Fast (1x)</option>
                                <option value="2" className="bg-[#111]">Social HD (2x)</option>
                                <option value="4" className="bg-[#111]">Print Ready (4x)</option>
                            </select>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdvancedSettings() {
    const { userSettings, updateUserSettings } = useStore();

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Advanced Settings</h3>

                <div className="space-y-4">
                    {/* Auto-apply Rules */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                            <p className="font-medium text-white">Auto-apply Rules</p>
                            <p className="text-sm text-white/50">Automatically assign templates based on defined rules</p>
                        </div>
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={userSettings.autoApplyRules}
                                onChange={(e) => updateUserSettings({ autoApplyRules: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                    </div>

                    {/* Batch Processing */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                            <p className="font-medium text-white">Batch Processing</p>
                            <p className="text-sm text-white/50">Process multiple files simultaneously</p>
                        </div>
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={userSettings.batchProcessing}
                                onChange={(e) => updateUserSettings({ batchProcessing: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                    </div>

                    {/* Cache Templates */}
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                        <div>
                            <p className="font-medium text-white">Cache Templates</p>
                            <p className="text-sm text-white/50">Store templates locally for faster processing</p>
                        </div>
                        <label className="relative inline-block w-12 h-6 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={userSettings.cacheTemplates}
                                onChange={(e) => updateUserSettings({ cacheTemplates: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                        </label>
                    </div>

                    {/* Processing Timeout */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <label className="block">
                            <p className="font-medium text-white mb-2">Processing Timeout</p>
                            <p className="text-sm text-white/50 mb-3">Maximum time to wait for processing (seconds)</p>
                            <input
                                type="number"
                                defaultValue="300"
                                min="60"
                                max="600"
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-pink-500 outline-none"
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DataSettings({ projects, onClose }) {
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const handleClearData = () => {
        localStorage.clear();
        window.location.reload();
    };

    const handleSignOut = () => {
        signOut({ callbackUrl: "/" });
    };

    const totalFiles = projects.reduce((sum, p) => sum + (p.files?.length || 0), 0);
    const totalTemplates = projects.reduce((sum, p) => sum + (p.templates?.length || 0), 0);

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Data & Privacy</h3>

                <div className="space-y-4">
                    {/* Storage Info */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <p className="font-medium text-white mb-3">Storage Usage</p>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-white/50">Projects</span>
                                <span className="text-white font-medium">{projects.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Total Files</span>
                                <span className="text-white font-medium">{totalFiles}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-white/50">Total Templates</span>
                                <span className="text-white font-medium">{totalTemplates}</span>
                            </div>
                        </div>
                    </div>

                    {/* Clear Data */}
                    <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/30">
                        <div className="flex items-start gap-3">
                            <Trash2 className="text-red-400 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="font-medium text-white mb-1">Clear All Data</p>
                                <p className="text-sm text-white/50 mb-3">
                                    This will permanently delete all projects, files, and templates from local storage.
                                    Files on Google Drive will not be affected.
                                </p>
                                <button
                                    onClick={() => setShowClearConfirm(true)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Clear All Data
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sign Out */}
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start gap-3">
                            <Shield className="text-white/50 mt-0.5" size={20} />
                            <div className="flex-1">
                                <p className="font-medium text-white mb-1">Sign Out</p>
                                <p className="text-sm text-white/50 mb-3">
                                    Sign out of your account. Your data will be saved locally.
                                </p>
                                <button
                                    onClick={handleSignOut}
                                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clear Data Confirmation */}
            {showClearConfirm && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-[#111] border border-red-500/30 rounded-xl p-6 max-w-md">
                        <h3 className="text-lg font-bold text-white mb-2">Are you absolutely sure?</h3>
                        <p className="text-white/70 text-sm mb-4">
                            This action cannot be undone. All your local data will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowClearConfirm(false)}
                                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleClearData}
                                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium"
                            >
                                Delete Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
