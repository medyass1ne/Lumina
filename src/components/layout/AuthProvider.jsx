"use client";

import { SessionProvider, useSession, signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function AuthLoadingGuard({ children }) {
    const { status, data: session } = useSession();

    useEffect(() => {
        if (status === "authenticated" && session) {
            const checkExpiration = () => {
                fetch("/api/auth/session")
                    .then(res => res.json())
                    .then(data => {
                        if (!data || !data.user) {
                            signOut({ callbackUrl: "/" });
                        }
                    })
                    .catch(() => {
                        signOut({ callbackUrl: "/" });
                    });
            };

            const interval = setInterval(checkExpiration, 5 * 60 * 1000);

            checkExpiration();

            return () => clearInterval(interval);
        }
    }, [status, session]);

    if (status === "loading") {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
                <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full animate-pulse" />
                    <Loader2 size={48} className="animate-spin text-pink-500 relative z-10" />
                </div>
                <p className="mt-4 text-white/50 font-syne animate-pulse">Initializing Lumina...</p>
            </div>
        );
    }

    return children;
}

export function AuthProvider({ children }) {
    return (
        <SessionProvider>
            <AuthLoadingGuard>
                {children}
            </AuthLoadingGuard>
        </SessionProvider>
    );
}
