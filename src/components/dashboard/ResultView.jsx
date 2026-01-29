"use client";
import React, { useState } from "react";
import { X, Download, ArrowLeft, ArrowRight, Check, Share2, Split, Eye } from "lucide-react";
import { GlassButton } from "@/components/ui/GlassButton";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";

export function ResultView({ results, onClose }) {
    // result = { original: { url, name }, processed: { blob (or url), name } }

    const [viewMode, setViewMode] = useState("split");

    const handleDownload = (result) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(result.processed.blob);
        link.download = result.processed.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        results.forEach(result => handleDownload(result));
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-black/20">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold font-syne text-white flex items-center gap-2">
                            Processing Complete <Check size={16} className="text-green-400" />
                        </h2>
                        <p className="text-sm text-white/50">{results.length} images enhanced</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-white/5 p-1 rounded-lg flex items-center border border-white/10">
                        <button onClick={() => setViewMode("original")} className={cn("px-3 py-1 text-xs font-medium rounded transition-all", viewMode === "original" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>Original</button>
                        <button onClick={() => setViewMode("split")} className={cn("px-3 py-1 text-xs font-medium rounded transition-all", viewMode === "split" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70")}>Compare</button>
                        <button onClick={() => setViewMode("processed")} className={cn("px-3 py-1 text-xs font-medium rounded transition-all", viewMode === "processed" ? "bg-white/10 text-white bg-pink-500/20 text-pink-200" : "text-white/40 hover:text-white/70")}>Result</button>
                    </div>

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <GlassButton onClick={handleDownloadAll} className="bg-white/10 hover:bg-white/20">
                        <Download size={16} className="mr-2" /> Download All
                    </GlassButton>
                    <GlassButton onClick={onClose} className="bg-pink-600 hover:bg-pink-500">
                        Done
                    </GlassButton>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {results.map((result, idx) => (
                    <ResultCard
                        key={idx}
                        result={result}
                        viewMode={viewMode}
                        onDownload={() => handleDownload(result)}
                    />
                ))}
            </div>
        </div>
    );
}

function ResultCard({ result, viewMode, onDownload }) {
    const [processedUrl, setProcessedUrl] = useState(null);

    React.useEffect(() => {
        const u = URL.createObjectURL(result.processed.blob);
        setProcessedUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [result]);

    if (!processedUrl) return <div className="aspect-[4/5] bg-white/5 animate-pulse rounded-2xl" />;

    return (
        <div className="bg-[#111] rounded-2xl overflow-hidden border border-white/10 flex flex-col">
            <div className="flex-1 relative aspect-[4/5] group bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-white/5 overflow-hidden">

                {viewMode === "split" && (
                    <BeforeAfterSlider
                        beforeSrc={result.original.url}
                        afterSrc={processedUrl}
                    />
                )}

                {viewMode === "original" && (
                    <img src={result.original.url} className="w-full h-full object-contain" />
                )}

                {viewMode === "processed" && (
                    <img src={processedUrl} className="w-full h-full object-contain" />
                )}

            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
                <div className="truncate pr-4">
                    <p className="text-sm font-medium text-white truncate">{result.processed.name}</p>
                    <p className="text-xs text-white/40">Ready for download</p>
                </div>
                <button onClick={onDownload} className="p-2 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors">
                    <Download size={18} />
                </button>
            </div>
        </div>
    );
}
