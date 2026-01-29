"use client";
import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Plus, Folder, Trash2, MoreVertical, LayoutGrid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlassButton } from '@/components/ui/GlassButton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SettingsModal } from './SettingsModal';

import { X } from 'lucide-react';

export function ProjectSidebar({ className, isOpen, onClose }) {
    const { projects, activeProjectId, createProject, setActiveProject, deleteProject } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [showSettings, setShowSettings] = useState(false);

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        createProject(newProjectName);
        setNewProjectName("");
        setIsCreating(false);
    };

    return (
        <div className={cn(
            "w-64 border-r border-white/10 bg-[#0a0a0a] md:bg-black/20 flex flex-col h-full",
            "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
            isOpen ? "translate-x-0" : "-translate-x-full",
            className
        )}>
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-sm font-bold text-white/50 uppercase tracking-wider px-2">Projects</h2>
                <button
                    onClick={onClose}
                    className="md:hidden p-1 text-white/50 hover:text-white"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="px-4 pb-4">
                {!isCreating ? (
                    <GlassButton
                        onClick={() => setIsCreating(true)}
                        className="w-full flex items-center justify-center gap-2 bg-pink-600/20 hover:bg-pink-600/40 border-pink-500/30 text-pink-200"
                    >
                        <Plus size={16} />
                        <span>New Project</span>
                    </GlassButton>
                ) : (
                    <form onSubmit={handleCreate} className="space-y-2">
                        <input
                            autoFocus
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Project Name..."
                            className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500/50"
                            onBlur={() => !newProjectName && setIsCreating(false)}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-pink-600 text-white text-xs py-1 rounded hover:bg-pink-500"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="flex-1 bg-white/10 text-white/70 text-xs py-1 rounded hover:bg-white/20"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {projects.length === 0 && (
                    <div className="text-center py-8 px-4">
                        <Folder className="mx-auto text-white/20 mb-2" size={24} />
                        <p className="text-xs text-white/40">No projects yet</p>
                    </div>
                )}

                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => setActiveProject(project.id)}
                        className={cn(
                            "group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent",
                            activeProjectId === project.id
                                ? "bg-pink-500/10 border-pink-500/20 text-white"
                                : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                    >
                        <div className="flex items-center gap-3 truncate">
                            <Folder size={16} className={cn(
                                activeProjectId === project.id ? "text-pink-400" : "text-white/40 group-hover:text-white/60"
                            )} />
                            <span className="text-sm font-medium truncate">{project.name}</span>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(project);
                                }}
                                className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
                <button
                    onClick={() => setShowSettings(true)}
                    className="w-full flex items-center gap-3 text-white/40 hover:text-white text-xs p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <Settings size={14} />
                    <span>General Settings</span>
                </button>
            </div>

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => {
                    if (deleteConfirm) deleteProject(deleteConfirm.id);
                }}
                title="Delete Project?"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? All files and templates will be permanently removed.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </div>
    );
}
