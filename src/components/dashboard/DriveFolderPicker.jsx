"use client";
import React, { useEffect, useCallback, useState } from 'react';
import { useSession } from "next-auth/react";
import { GlassButton } from "@/components/ui/GlassButton";
import { Loader2, AlertCircle, FolderSearch } from "lucide-react";
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

export default function DriveFolderPicker({ onSelect, className, label = "Select Watch Folder" }) {
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
            const google = window.google;
            if (!google || !google.picker) {
                console.error("Picker API not loaded");
                return;
            }

            const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
                .setIncludeFolders(true)
                .setSelectFolderEnabled(true)
                .setMimeTypes('application/vnd.google-apps.folder');

            const picker = new google.picker.PickerBuilder()
                .addView(view)
                .setOAuthToken(session.accessToken)
                .setCallback(pickerCallback)
                .setTitle("Select Folder to Watch")
                .build();

            picker.setVisible(true);

        } catch (err) {
            console.error("Error creating picker:", err);
            setError("Could not open Drive picker");
        }
    }, [session, libLoaded]);

    const pickerCallback = (data) => {
        if (data.action === window.google.picker.Action.PICKED) {
            const doc = data.docs[0];
            if (doc) {
                onSelect({
                    id: doc.id,
                    name: doc.name,
                    mimeType: doc.mimeType
                });
            }
        }
    };

    const isLoading = status === "loading" || (!libLoaded && !error);
    const isDisabled = isLoading || !session || !!error;

    return (
        <GlassButton
            onClick={handleOpenPicker}
            disabled={isDisabled}
            className={cn(
                "bg-indigo-600/20 hover:bg-indigo-600/40 border-indigo-500/30 transition-all duration-300 gap-2 justify-center",
                isDisabled ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg hover:shadow-indigo-500/20",
                className
            )}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FolderSearch className="w-4 h-4" />
            )}

            <span>{isLoading ? "Loading..." : label}</span>
        </GlassButton>
    );
}
