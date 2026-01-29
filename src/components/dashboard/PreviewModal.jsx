"use client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { applyTemplate } from "@/lib/image-processor";
import { cn } from "@/lib/utils";

import { useSession } from "next-auth/react";

export function PreviewModal({ isOpen, onClose, file, template }) {
    const { data: session } = useSession();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!isOpen || !file || !template) {
            setPreviewUrl(null);
            return;
        }

        const generatePreview = async () => {
            setLoading(true);
            try {
                let imageSource = file.blob;

                if (!imageSource && file.previewUrl) {
                    try {
                        const src = file.previewUrl;

                        // Check if auth is needed (same logic as AuthenticatedImage)
                        const needsAuth = src.includes('drive.google.com') || (src.includes('googleapis.com') && src.includes('/drive/'));

                        let fetchUrl = src;
                        let headers = {};

                        if (needsAuth) {
                            if (session?.accessToken) {
                                headers = { Authorization: `Bearer ${session.accessToken}` };
                            }
                        } else {
                            fetchUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
                        }

                        const res = await fetch(fetchUrl, { headers });
                        if (!res.ok) throw new Error(`Failed to fetch image source: ${res.status}`);
                        imageSource = await res.blob();
                    } catch (e) {
                        console.warn("Could not fetch thumbnail for preview:", e);
                    }
                }

                if (!imageSource) throw new Error("No image source available - File might be corrupted or link expired");

                let templateBlob;
                try {
                    const templateRes = await fetch(template.previewUrl);
                    if (!templateRes.ok) throw new Error("Failed to fetch template");
                    templateBlob = await templateRes.blob();
                } catch (e) {
                    throw new Error("Template preview unavailable");
                }

                const targetWidth = 800;
                const img = new Image();
                img.src = URL.createObjectURL(imageSource);
                await img.decode();
                const ratio = img.naturalHeight / img.naturalWidth;
                const targetHeight = Math.round(targetWidth * ratio);

                const resultBlob = await applyTemplate(imageSource, templateBlob, targetWidth, targetHeight);
                setPreviewUrl(URL.createObjectURL(resultBlob));

            } catch (error) {
                console.error("Preview failed:", error);
                setPreviewUrl(null);
            } finally {
                setLoading(false);
            }
        };

        generatePreview();

        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [isOpen, file, template]);

    return (
        <div className={cn("fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm", !isOpen && "hidden")}>
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h3 className="font-bold font-syne text-white">Preview Result</h3>
                    <button onClick={onClose} className="text-white/50 hover:text-white px-2">Close</button>
                </div>

                <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-black/50">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-pink-500" size={32} />
                            <p className="text-white/50 text-sm">Generating Preview...</p>
                        </div>
                    ) : previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="max-w-full max-h-[70vh] rounded shadow-2xl border border-white/10" />
                    ) : (
                        <p className="text-white/30">Failed to load preview</p>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end">
                    <p className="text-xs text-white/30 mr-auto self-center">
                        Template: <span className="text-white/70">{template?.name}</span> •
                        Image: <span className="text-white/70">{file?.name}</span>
                    </p>
                    <button onClick={onClose} className="glass-button bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg">Done</button>
                </div>
            </div>
        </div>
    );
}
