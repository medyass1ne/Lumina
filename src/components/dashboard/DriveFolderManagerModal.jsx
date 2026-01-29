"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Folder, ChevronRight, Plus, Check, Loader2, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassButton } from "@/components/ui/GlassButton";
import { listFolders, createFolder } from "@/lib/drive-helper";

export default function DriveFolderManagerModal({ isOpen, onClose, onSelect }) {
    const { data: session } = useSession();
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'My Drive' }]);
    const [folders, setFolders] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentFolder = breadcrumbs[breadcrumbs.length - 1];

    useEffect(() => {
        if (isOpen && session?.accessToken) {
            loadFolders(currentFolder.id);
        }
    }, [isOpen, currentFolder.id, session?.accessToken]);

    const loadFolders = async (parentId) => {
        setIsLoading(true);
        try {
            const list = await listFolders(session.accessToken, parentId);
            setFolders(list);
        } catch (error) {
            console.error("Failed to load folders", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (folder) => {
        setBreadcrumbs([...breadcrumbs, folder]);
        setIsCreating(false);
    };

    const handleBreadcrumbClick = (index) => {
        setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        setIsCreating(false);
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim() || !session?.accessToken) return;

        setIsSubmitting(true);
        try {
            const newFolder = await createFolder(session.accessToken, currentFolder.id, newFolderName.trim());
            console.log("Created folder:", newFolder);
            setNewFolderName("");
            setIsCreating(false);
            loadFolders(currentFolder.id);
        } catch (error) {
            alert("Failed to create folder: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <div>
                        <h2 className="text-lg font-bold text-white">Select Watch Folder</h2>
                        <p className="text-white/50 text-xs">Navigate to the folder you want to monitor</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Breadcrumbs */}
                <div className="px-4 py-3 bg-[#0a0a0a] border-b border-white/5 flex items-center gap-2 overflow-x-auto">
                    {breadcrumbs.map((crumb, index) => (
                        <div key={crumb.id} className="flex items-center whitespace-nowrap">
                            {index > 0 && <ChevronRight size={14} className="text-white/20 mx-1" />}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={cn(
                                    "flex items-center gap-1.5 text-sm px-2 py-1 rounded hover:bg-white/5 transition-colors",
                                    index === breadcrumbs.length - 1 ? "text-white font-medium" : "text-white/50"
                                )}
                            >
                                {index === 0 && <Home size={14} />}
                                {crumb.name}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/30">
                            <Loader2 size={32} className="animate-spin mb-2" />
                            <p>Loading folders...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Create New Item */}
                            {isCreating ? (
                                <form onSubmit={handleCreateFolder} className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-blue-200 uppercase">New Folder</span>
                                        <button type="button" onClick={() => setIsCreating(false)}><X size={14} className="text-blue-300" /></button>
                                    </div>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        placeholder="Folder Name"
                                        className="bg-[#0a0a0a] border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : "Create"}
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="p-4 border border-dashed border-white/10 rounded-xl flex items-center gap-3 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                                        <Plus size={20} />
                                    </div>
                                    <span className="font-medium">Create New Folder</span>
                                </button>
                            )}

                            {/* Folder List */}
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleNavigate(folder)}
                                    className="group p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between hover:bg-white/10 hover:border-white/20 transition-all text-left"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <Folder size={20} className="text-blue-400 shrink-0" />
                                        <span className="truncate text-sm text-white/80 group-hover:text-white">{folder.name}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-white/20 group-hover:text-white/50" />
                                </button>
                            ))}

                            {!isCreating && folders.length === 0 && (
                                <div className="col-span-full py-12 text-center text-white/30 text-sm">
                                    No folders found in this directory.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10 bg-[#0a0a0a] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-white/50 hover:text-white text-sm font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <GlassButton
                        onClick={() => onSelect(currentFolder)}
                        className="bg-green-600 hover:bg-green-500 border-green-500/30 pl-3 pr-5"
                    >
                        <Check size={16} className="mr-2" />
                        Select "{currentFolder.name}"
                    </GlassButton>
                </div>
            </motion.div>
        </div>
    );
}
