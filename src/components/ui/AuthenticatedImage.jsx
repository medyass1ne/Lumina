"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Skeleton from 'react-loading-skeleton';

// Global cache for authenticated image blobs (URL -> blobUrl)
const blobCache = new Map();

export function AuthenticatedImage({ src, alt, className, fallbackSrc }) {
    const { data: session } = useSession();
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        let createdUrl = null;

        const loadImage = async () => {
            setLoading(true);
            setError(false);

            if (!src) {
                setLoading(false);
                return;
            }

            if (src.startsWith('blob:') || src.startsWith('data:')) {
                setImageSrc(src);
                setLoading(false);
                return;
            }

            if (blobCache.has(src)) {
                setImageSrc(blobCache.get(src));
                setLoading(false);
                return;
            }

            // We specifically want to intercept 'drive.google.com' (e.g. file view) and 'googleapis.com' (API media download)
            const needsAuth = src.includes('drive.google.com') || (src.includes('googleapis.com') && src.includes('/drive/'));

            if (!needsAuth) {
                setImageSrc(src);
                setLoading(false);
                return;
            }

            try {
                const res = await fetch(src, {
                    headers: session?.accessToken ? {
                        Authorization: `Bearer ${session.accessToken}`
                    } : {}
                });

                if (res.ok) {
                    const blob = await res.blob();
                    if (isMounted) {
                        const url = URL.createObjectURL(blob);
                        blobCache.set(src, url);
                        setImageSrc(url);
                        // We do NOT set createdUrl here because the cleanup is handled by the cache lifecycle (session)
                    }
                } else {
                    console.warn(`Auth fetch failed for image, falling back to direct link: ${res.status}`);
                    setImageSrc(src);
                }
            } catch (err) {
                console.error("Failed to load authenticated image", err);
                setImageSrc(src);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadImage();

        return () => {
            isMounted = false;
            if (createdUrl) URL.revokeObjectURL(createdUrl);
        };
    }, [src, session?.accessToken]);

    if (loading) {
        return (
            <Skeleton className={cn("w-full h-full block", className)} baseColor="#202020" highlightColor="#444" />
        );
    }

    if (error || !imageSrc) {
        return (
            <div className={cn("flex items-center justify-center bg-white/5", className)}>
                <ImageOff className="w-6 h-6 text-white/20" />
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
}
