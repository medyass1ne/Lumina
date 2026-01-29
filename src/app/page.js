"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Sparkles, Image as ImageIcon, Zap } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";

export default function LandingPage() {
    const router = useRouter();
    const { data: session } = useSession();

    const handleLogin = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: "easeOut" }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden">
            {/* Background Gradients */}
            <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
                className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-900/20 rounded-full blur-[120px] pointer-events-none"
            />

            <Navbar />

            <motion.main
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="container mx-auto px-4 pt-32 pb-20 flex flex-col items-center text-center relative z-10"
            >
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                    <Sparkles size={14} className="text-pink-400" />
                    <span className="text-xs font-medium text-pink-200/80 tracking-wide uppercase">AI-Powered Enhancement Studio</span>
                </motion.div>

                <motion.h1 variants={itemVariants} className="text-4xl md:text-7xl font-black tracking-tighter mb-6 max-w-4xl bg-clip-text text-transparent bg-linear-to-b from-white via-white/90 to-white/50 px-2">
                    Transform Your Images with <br />
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-pink-400 to-rose-500 font-syne uppercase text-3xl md:text-7xl block mt-2">Intelligent Upscaling</span>
                </motion.h1>

                <motion.p variants={itemVariants} className="text-base md:text-xl text-white/50 max-w-2xl mb-12 leading-relaxed px-4">
                    Seamlessly connect with Google Drive. Batch process your assets.
                    Apply smart templates and upscale automatically.
                </motion.p>

                <motion.div variants={itemVariants}>
                    {session ? (
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center gap-3"
                        >
                            <span>Go to Dashboard</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleLogin}
                            className="group relative px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] flex items-center gap-3"
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                            <span>Sign in with Google</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    )}
                </motion.div>

                {/* Feature Grid */}
                <motion.div
                    variants={containerVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-5xl"
                >
                    {[
                        { icon: <ImageIcon />, title: "Drive Integration", desc: "Select assets directly from your Google Drive folders." },
                        { icon: <Zap />, title: "Instant Upscaling", desc: "4x enhancement with preservation of details." },
                        { icon: <Sparkles />, title: "Smart Watermarking", desc: "Apply dynamic templates to your batch." }
                    ].map((f, i) => (
                        <motion.div
                            key={i}
                            variants={itemVariants}
                            whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.08)" }}
                            className="p-6 rounded-2xl bg-white/5 border border-white/10 transition-colors text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4 text-pink-400">
                                {f.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-2 font-syne">{f.title}</h3>
                            <p className="text-white/50">{f.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </motion.main>
        </div>
    );
}
