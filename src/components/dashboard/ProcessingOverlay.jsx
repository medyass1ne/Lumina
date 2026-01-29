
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProcessingOverlay({ isOpen, files }) {

    const progressStats = useMemo(() => {
        if (!files || files.length === 0) return { percent: 0, text: 'Preparing...', active: 0 };

        const processingFiles = files.filter(f => f.status === 'processing');
        const completedFiles = files.filter(f => f.status === 'done');

        const total = processingFiles.length + completedFiles.length;
        if (total === 0) return { percent: 0, text: 'Initializing...', active: 0 };

        const totalProgress = processingFiles.reduce((acc, f) => acc + (f.progress || 0), 0) + (completedFiles.length * 100);
        const avg = Math.round(totalProgress / total);

        return {
            percent: avg,
            text: processingFiles.length > 0 ? `Enhancing ${processingFiles.length} images...` : 'Finalizing...',
            active: processingFiles.length
        };
    }, [files]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8"
                >
                    <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
                        <div className="relative mb-6">
                            {/* Spinning loader ring */}
                            <svg className="w-24 h-24 transform -rotate-90">
                                <circle
                                    cx="48" cy="48" r="44"
                                    stroke="currentColor" strokeWidth="4"
                                    fill="transparent"
                                    className="text-white/10"
                                />
                                <circle
                                    cx="48" cy="48" r="44"
                                    stroke="currentColor" strokeWidth="4"
                                    fill="transparent"
                                    strokeDasharray={276}
                                    strokeDashoffset={276 - (276 * progressStats.percent) / 100}
                                    className="text-pink-500 transition-all duration-300 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-xl font-bold font-syne text-white">
                                {progressStats.percent}%
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 font-syne animate-pulse">
                            Processing Batch
                        </h3>
                        <p className="text-white/50 text-center mb-6">
                            {progressStats.text}
                        </p>

                        {/* Visual feedback of files */}
                        <div className="flex gap-2 justify-center flex-wrap max-w-full">
                            {files.map(f => (
                                <div
                                    key={f.id}
                                    className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-300",
                                        f.status === 'processing' ? "bg-pink-500 scale-125 animate-bounce" :
                                            f.status === 'done' ? "bg-green-500" :
                                                f.status === 'error' ? "bg-red-500" :
                                                    "bg-white/20"
                                    )}
                                    title={`${f.name}: ${f.status}`}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
