"use client";
import React, { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { motion, AnimatePresence } from "framer-motion";
import { PreviewModal } from "./PreviewModal";
import { AuthenticatedImage } from "@/components/ui/AuthenticatedImage";
import { Loader2, CheckCircle, AlertCircle, Trash2, X, ChevronDown, ChevronRight, LayoutTemplate, Smartphone, Maximize, Monitor, Eye, Crop } from "lucide-react";
import { groupFilesByType } from "@/lib/auto-detector";
import { cn } from "@/lib/utils";

const GROUP_ICONS = {
    "Square": <Maximize size={18} />,
    "Portrait": <LayoutTemplate size={18} />,
    "Landscape": <Monitor size={18} />,
    "Story": <Smartphone size={18} />,
    "Unknown": <AlertCircle size={18} />
};

export function ImageGrid({ files, onRemove, onEdit, templates, batchConfig, onConfigChange }) {
    const [groupedFiles, setGroupedFiles] = useState({});
    const [expandedGroups, setExpandedGroups] = useState({
        "Square": true, "Portrait": true, "Landscape": true, "Story": true, "Unknown": true
    });

    const [previewFile, setPreviewFile] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const [selectedFiles, setSelectedFiles] = useState(new Set());

    const toggleSelect = (id) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectGroup = (fileIds) => {
        setSelectedFiles(prev => {
            const newSet = new Set(prev);
            const allSelected = fileIds.every(id => prev.has(id));

            if (allSelected) {
                fileIds.forEach(id => newSet.delete(id));
            } else {
                fileIds.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };

    const handleDeleteSelected = () => {
        if (!confirm(`Are you sure you want to delete ${selectedFiles.size} images?`)) return;

        selectedFiles.forEach(id => {
            if (onRemove) onRemove(id);
        });
        setSelectedFiles(new Set());
    };

    const clearSelection = () => setSelectedFiles(new Set());

    useEffect(() => {
        const process = async () => {
            const groups = await groupFilesByType(files);
            setGroupedFiles(groups);

            const newConfig = { ...batchConfig };
            let hasChanges = false;

            Object.keys(groups).forEach(type => {
                if (!newConfig[type] && groups[type].length > 0) {
                    const matchingTemplate = templates.find(t => t.aspectRatio === type) || templates[0];
                    if (matchingTemplate) {
                        newConfig[type] = matchingTemplate.id;
                        hasChanges = true;
                    }
                }
            });

            if (hasChanges && onConfigChange) {
                onConfigChange(newConfig);
            }
        };
        process();
    }, [files, templates]);

    const toggleGroup = (type) => {
        setExpandedGroups(prev => ({ ...prev, [type]: !prev[type] }));
    };

    const handleGroupTemplateChange = (type, templateId) => {
        if (onConfigChange) {
            onConfigChange({ ...batchConfig, [type]: templateId });
        }
    };

    const handlePreview = (file, groupType) => {
        const templateId = batchConfig ? batchConfig[groupType] : null;
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setPreviewFile(file);
            setPreviewTemplate(template);
        } else {
            alert("Please select a template for this group first.");
        }
    };

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
    const itemVariants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } };

    if (files.length === 0) return null;

    return (
        <div className="space-y-8">
            <PreviewModal
                isOpen={!!previewFile}
                onClose={() => setPreviewFile(null)}
                file={previewFile}
                template={previewTemplate}
            />

            {/* Selection Toolbar */}
            <AnimatePresence>
                {selectedFiles.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="sticky top-4 z-40 bg-pink-900/90 border border-pink-500/50 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-2xl flex items-center justify-between mb-6"
                    >
                        <div className="flex items-center gap-4">
                            <CheckCircle className="text-pink-400" />
                            <span className="font-medium">{selectedFiles.size} images selected</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={clearSelection}
                                className="px-3 py-1.5 text-sm text-pink-200 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSelected}
                                className="bg-white text-pink-700 px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-pink-100 flex items-center gap-2"
                            >
                                <Trash2 size={16} /> Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {Object.entries(groupedFiles).map(([type, groupFiles]) => {
                if (groupFiles.length === 0) return null;

                const assignedTemplateId = batchConfig ? batchConfig[type] : "";

                return (
                    <div key={type} className="border border-white/10 rounded-xl bg-black/20 overflow-hidden">
                        {/* Group Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 border-b border-white/10 gap-4 sm:gap-0">
                            <div className="flex items-center gap-4">
                                <button
                                    className="text-white/50 hover:text-white"
                                    onClick={() => toggleGroup(type)}
                                >
                                    {expandedGroups[type] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>

                                {/* Select All Checkbox for Group */}
                                <div
                                    className={cn(
                                        "w-5 h-5 rounded border border-white/30 flex items-center justify-center cursor-pointer transition-colors",
                                        groupFiles.length > 0 && groupFiles.every(f => selectedFiles.has(f.id)) ? "bg-pink-500 border-pink-500" : "hover:border-white/60"
                                    )}
                                    onClick={() => toggleSelectGroup(groupFiles.map(f => f.id))}
                                >
                                    {groupFiles.length > 0 && groupFiles.every(f => selectedFiles.has(f.id)) && <CheckCircle size={14} className="text-white" />}
                                </div>

                                <div
                                    className="flex items-center gap-2 text-white/80 cursor-pointer select-none"
                                    onClick={() => toggleGroup(type)}
                                >
                                    {GROUP_ICONS[type] || <AlertCircle size={18} />}
                                    <span className="font-bold">{type}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/50">{groupFiles.length}</span>
                                </div>
                            </div>

                            {/* Group Controls */}
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                                    <span className="text-xs text-white/40 uppercase tracking-wider font-bold hidden sm:inline">Apply Template</span>
                                    <select
                                        value={assignedTemplateId || ""}
                                        onChange={(e) => handleGroupTemplateChange(type, e.target.value)}
                                        className="bg-[#0a0a0a] border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500 w-full sm:w-[200px]"
                                    >
                                        <option value="">Select Template...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.aspectRatio})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Files Grid */}
                        <AnimatePresence>
                            {expandedGroups[type] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="p-4"
                                >
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                        {groupFiles.map(file => {
                                            const isSelected = selectedFiles.has(file.id);
                                            return (
                                                <motion.div
                                                    key={file.id}
                                                    layout
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className={cn(
                                                        "group relative aspect-square bg-[#111] rounded-lg overflow-hidden border transition-all cursor-pointer",
                                                        isSelected ? "border-pink-500 ring-2 ring-pink-500/20" : "border-white/5 hover:border-pink-500/50"
                                                    )}
                                                    onClick={() => toggleSelect(file.id)}
                                                >
                                                    <AuthenticatedImage
                                                        src={file.thumbnail}
                                                        alt={file.name}
                                                        className={cn(
                                                            "w-full h-full object-cover transition-all duration-500",
                                                            isSelected ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                                                        )}
                                                    />

                                                    {/* Selection Overlay */}
                                                    <div className={cn(
                                                        "absolute inset-0 z-10 transition-colors",
                                                        isSelected ? "bg-pink-500/10" : "group-hover:bg-white/5"
                                                    )} />

                                                    {/* Checkbox (Visible on hover or selected) */}
                                                    <div className={cn(
                                                        "absolute top-2 left-2 z-30 w-6 h-6 rounded-full border border-white/50 flex items-center justify-center transition-all bg-black/40 backdrop-blur-sm",
                                                        isSelected ? "bg-pink-500 border-pink-500 opacity-100" : "opacity-0 group-hover:opacity-100"
                                                    )}>
                                                        {isSelected && <CheckCircle size={14} className="text-white" />}
                                                    </div>

                                                    {/* File Actions Overlay - Modified to prevent propagation */}
                                                    {!isSelected && (
                                                        <div className="absolute inset-x-0 top-0 p-2 flex justify-end gap-2 items-start opacity-0 group-hover:opacity-100 transition-opacity z-20 w-full pointer-events-none">
                                                            <div className="flex gap-2 pointer-events-auto">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handlePreview(file, type); }}
                                                                    className="p-1.5 bg-blue-500/80 hover:bg-blue-500 text-white rounded-full shadow-lg backdrop-blur-sm"
                                                                    title="Quick Preview"
                                                                >
                                                                    <Eye size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(file); }}
                                                                    className="p-1.5 bg-yellow-500/80 hover:bg-yellow-500 text-white rounded-full shadow-lg backdrop-blur-sm"
                                                                    title="Edit / Crop"
                                                                >
                                                                    <Crop size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
                                                                    className="p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-full shadow-lg backdrop-blur-sm"
                                                                    title="Remove"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Footer Info */}
                                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                                                        <p className="text-xs font-medium truncate text-white/90">{file.name}</p>
                                                        {file.status === 'processing' && (
                                                            <div className="w-full h-0.5 bg-white/20 mt-1 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500" style={{ width: `${file.progress}%` }} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}
