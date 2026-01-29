"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/layout/Navbar";
import { ProjectSidebar } from "@/components/dashboard/ProjectSidebar";
import { ProjectView } from "@/components/dashboard/ProjectView";
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';

import { useState } from "react";

export function DashboardClient() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { activeProjectId } = useStore();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.replace("/");
        } else {
            const { login } = useStore.getState();
            login(session.user);
        }
    }, [session, status, router]);

    if (status === "loading" || !session) {
        return (
            <SkeletonTheme baseColor="#111" highlightColor="#333">
                <div className="h-screen bg-[#0a0a0a] text-white flex flex-col pt-16 overflow-hidden">
                    {/* Fake Navbar */}
                    <div className="fixed top-0 left-0 right-0 h-16 border-b border-white/10 bg-black/50 z-50 flex items-center justify-between px-8">
                        <Skeleton width={120} height={32} />
                        <Skeleton circle width={40} height={40} />
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Fake Sidebar */}
                        <div className="w-64 border-r border-white/10 bg-black/20 p-4 flex flex-col gap-4 hidden md:flex">
                            <Skeleton height={40} borderRadius={8} />
                            <div className="space-y-2 mt-4">
                                <Skeleton height={48} borderRadius={8} count={3} />
                            </div>
                        </div>

                        {/* Fake Main Content */}
                        <div className="flex-1 p-8 flex flex-col gap-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Skeleton width={200} height={40} className="mb-2" />
                                    <Skeleton width={150} height={20} />
                                </div>
                                <div className="flex gap-4">
                                    <Skeleton width={120} height={40} />
                                    <Skeleton width={120} height={40} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Skeleton height={200} borderRadius={12} count={4} />
                            </div>
                        </div>
                    </div>
                </div>
            </SkeletonTheme>
        );
    }

    return (
        <div className="h-screen bg-[#0a0a0a] text-white flex flex-col pt-16 overflow-hidden">
            <Navbar onMenuClick={() => setIsSidebarOpen(true)} />

            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar - Responsive */}
                <ProjectSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}

                {/* Main Content Area - Grows */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
                    {activeProjectId ? (
                        <ProjectView />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-8 text-center">
                            <h2 className="text-xl font-bold text-white/50 mb-2">No Project Selected</h2>
                            <p>Select a campaign from the sidebar or create a new one to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
