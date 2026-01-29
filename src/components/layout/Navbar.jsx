"use client";
import { useSession, signOut } from "next-auth/react";
import { LogOut, LayoutGrid, User, Menu } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Navbar({ onMenuClick }) {
    const { data: session } = useSession();
    const user = session?.user;
    const [imageError, setImageError] = useState(false);

    const handleLogout = () => {
        signOut({ callbackUrl: "/" });
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-white/10 bg-black/20 backdrop-blur-xl">
            <div className="container mx-auto h-full px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-2 -ml-2 text-white/70 hover:text-white"
                    >
                        <Menu size={24} />
                    </button>
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                            <LayoutGrid className="text-white w-5 h-5" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-transparent bg-clip-text bg-linear-to-r from-pink-200 to-rose-100 font-syne hidden sm:inline">
                            Lumina
                        </span>
                    </Link>
                </div>

                {user && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 rounded-full pl-1 pr-3 py-1 border border-white/5">
                            {user.image && !imageError ? (
                                <img
                                    src={user.image}
                                    alt="Avatar"
                                    className="w-6 h-6 rounded-full"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center">
                                    <User size={14} className="text-pink-300" />
                                </div>
                            )}
                            <span className="text-sm font-medium text-pink-100/80">{user.name}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
                            title="Sign out"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
