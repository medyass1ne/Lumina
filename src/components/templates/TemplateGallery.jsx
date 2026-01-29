"use client";
import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { Plus, LayoutTemplate, Smartphone, Maximize, Monitor, Edit2, Copy, Trash2, Upload, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function TemplateGallery({ onCreate, onEdit, onUpload }) {
    const { getTemplates, deleteTemplate, addTemplate } = useStore();
    const templates = getTemplates();
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [uploadFile, setUploadFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const sortedTemplates = [...(templates || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const getIcon = (ratio) => {
        switch (ratio) {
            case 'Story': return <Smartphone size={16} />;
            case 'Landscape': return <Monitor size={16} />;
            case 'Square': return <Maximize size={16} />;
            case 'Portrait': return <LayoutTemplate size={16} />;
            case 'Custom': return <Layers size={16} />;
            default: return <LayoutTemplate size={16} />;
        }
    };

    const handleDuplicate = (template) => {
        addTemplate({
            ...template,
            name: `${template.name} (Copy)`,
            createdAt: new Date().toISOString()
        });
    };

    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadFile(file);
        }
        e.target.value = '';
    };

    const confirmUpload = async (ratio) => {
        if (!uploadFile) return;
        setIsUploading(true);
        await onUpload(uploadFile, ratio);
        setIsUploading(false);
        setUploadFile(null);
    };

    return (
        <div className="bg-black/20 border border-white/10 rounded-2xl p-6 min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold font-syne">Templates</h2>
                    <p className="text-white/50 text-sm">Manage your enhancement designs</p>
                </div>
                <div className="flex gap-2">
                    <GlassButton onClick={onCreate} className="bg-pink-600 hover:bg-pink-500">
                        <Plus size={16} className="mr-2" /> New Template
                    </GlassButton>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Create Card */}
                <button
                    onClick={onCreate}
                    className="group flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-pink-500/50 bg-white/5 hover:bg-white/10 transition-all aspect-4/3"
                >
                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-pink-500/20 flex items-center justify-center mb-3 transition-colors">
                        <Plus size={24} className="text-white/30 group-hover:text-pink-400" />
                    </div>
                    <span className="text-sm font-medium text-white/50 group-hover:text-white">Create New</span>
                </button>

                {/* Upload Card - Shortcut */}
                <label className="group flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-white/10 transition-all aspect-4/3 cursor-pointer">
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} />
                    <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-blue-500/20 flex items-center justify-center mb-3 transition-colors">
                        <Upload size={24} className="text-white/30 group-hover:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-white/50 group-hover:text-white">Upload Template</span>
                </label>

                {/* Template Cards */}
                <AnimatePresence>
                    {sortedTemplates.map((template) => (
                        <motion.div
                            key={template.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            layout
                            className="group relative bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition-all shadow-lg"
                        >
                            {/* Preview Image */}
                            <div className="aspect-4/3 bg-white/5 relative bg-[url('https://transparenttextures.com/patterns/stardust.png')]">
                                <img src={template.previewUrl || template.thumbnail || template?.changes?.previewUrl || template?.changes?.thumbnail} alt={template.name} className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                            </div>

                            {/* Info Overlay */}
                            <div className="p-3 bg-[#111] border-t border-white/10">
                                <div className="flex items-start justify-between">
                                    <div className="truncate pr-2">
                                        <h3 className="font-medium text-sm truncate" title={template.name}>{template.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-white/40 mt-1">
                                            {getIcon(template.aspectRatio)}
                                            <span>{template.aspectRatio}</span>
                                        </div>
                                    </div>

                                    {/* Action Menu (Visible on hover) */}
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onEdit(template)}
                                            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(template)}
                                            className="p-1.5 rounded hover:bg-white/10 text-white/70 hover:text-white"
                                            title="Duplicate"
                                        >
                                            <Copy size={14} />
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(template)}
                                            className="p-1.5 rounded hover:bg-red-500/20 text-white/70 hover:text-red-400"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {sortedTemplates.length === 0 && (
                <div className="text-center py-12 border-t border-white/10 mt-6 hidden sm:block">
                    <p className="text-white/30 text-sm">No templates yet. Create one to get started.</p>
                </div>
            )}

            <ConfirmModal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                onConfirm={() => {
                    if (deleteConfirm) deleteTemplate(deleteConfirm.id);
                }}
                title="Delete Template?"
                message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            {/* Classification Modal for Upload */}
            <AnimatePresence>
                {uploadFile && (
                    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden"
                        >
                            <h3 className="text-xl font-bold mb-4 font-syne">Select Template Resolution</h3>
                            <p className="text-white/50 mb-6 text-sm">
                                To ensure this template works correctly with the auto-classifier, please select the aspect ratio that matches this image.
                            </p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {[
                                    { id: 'Square', label: 'Square (1:1)', icon: Maximize },
                                    { id: 'Portrait', label: 'Portrait (4:5)', icon: LayoutTemplate },
                                    { id: 'Landscape', label: 'Landscape (1.91:1)', icon: Monitor },
                                    { id: 'Story', label: 'Story (9:16)', icon: Smartphone },
                                    { id: 'Custom', label: 'Custom', icon: Layers }
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => confirmUpload(opt.id)}
                                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-pink-500/50 hover:text-pink-400 transition-all"
                                    >
                                        <opt.icon size={24} />
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => setUploadFile(null)}
                                    className="px-4 py-2 text-sm text-white/50 hover:text-white"
                                >
                                    Cancel
                                </button>
                            </div>

                            {isUploading && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px] flex items-center justify-center z-50">
                                    <div className="flex flex-col items-center gap-3 text-pink-400 font-medium">
                                        <div className="animate-spin w-8 h-8 border-2 border-current border-t-transparent rounded-full" />
                                        <span>Uploading...</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
