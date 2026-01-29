"use client";
import React, { useEffect, useCallback, useState } from 'react';
import { useSession } from "next-auth/react";
import { GlassButton } from "@/components/ui/GlassButton";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
    });
};

export default function DrivePicker({ onSelect, className }) {
    const { data: session, status } = useSession();
    const [libLoaded, setLibLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadGapi = async () => {
            try {
                await loadScript("https://apis.google.com/js/api.js");
                await loadScript("https://accounts.google.com/gsi/client");
                if (window.gapi) {
                    window.gapi.load('picker', () => {
                        setLibLoaded(true);
                    });
                }
            } catch (e) {
                console.error("Failed to load Google scripts", e);
                setError("Failed to load Drive API");
            }
        };
        loadGapi();
    }, []);

    const handleOpenPicker = useCallback(() => {
        if (!session?.accessToken || !libLoaded) return;

        try {
            createPicker(session.accessToken);
        } catch (err) {
            console.error("Error creating picker:", err);
            setError("Could not open Drive picker");
        }
    }, [session, libLoaded]);

    const createPicker = (token) => {
        const google = window.google;
        if (!google || !google.picker) {
            console.error("Picker API not loaded");
            return;
        }

        const view = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES)
            .setMimeTypes("image/png,image/jpeg,image/jpg,image/webp")
            .setIncludeFolders(true)
            .setSelectFolderEnabled(false);

        const picker = new google.picker.PickerBuilder()
            .addView(view)
            .setOAuthToken(token)
            .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
            .setCallback(pickerCallback)
            .setTitle("Select Images")
            .build();

        picker.setVisible(true);
    };

    const pickerCallback = async (data) => {
        if (data.action === window.google.picker.Action.PICKED) {
            const files = data.docs.map((doc) => {
                // We add sz=w640 to request a reasonable size for the grid preview.
                const thumbnail = `https://drive.google.com/thumbnail?id=${doc.id}&sz=w640`;

                return {
                    id: doc.id,
                    name: doc.name,
                    thumbnail: thumbnail,
                    mimeType: doc.mimeType,
                    status: 'idle',
                    source: 'drive',
                    progress: 0
                };
            });

            onSelect(files);
        } else if (data.action === window.google.picker.Action.CANCEL) {
            console.log("Picker canceled");
        }
    };

    const isLoading = status === "loading" || (!libLoaded && !error);
    const isDisabled = isLoading || !session || !!error;

    return (
        <GlassButton
            onClick={handleOpenPicker}
            disabled={isDisabled}
            className={cn(
                "bg-blue-600/20 hover:bg-blue-600/40 border-blue-500/30 transition-all duration-300 gap-2 min-w-[160px] justify-center",
                isDisabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg hover:shadow-blue-500/20",
                className
            )}
            title={!session ? "Please sign in to access Google Drive" : (error || "Select files from Google Drive")}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : error ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" alt="Drive" />
            )}

            <span>
                {isLoading ? "Loading..." : error ? "API Error" : "Select from Drive"}
            </span>
        </GlassButton>
    );
}
