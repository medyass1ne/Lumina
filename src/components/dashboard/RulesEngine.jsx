"use client";
import { useState } from "react";
import { useStore } from "@/store/useStore";
import { GlassButton } from "@/components/ui/GlassButton";
import { Plus, Trash2, Save, X, Zap, ArrowRight, Image as ImageIcon, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const FIELD_OPTIONS = [
    { value: "aspectRatio", label: "Aspect Ratio", icon: ImageIcon },
    { value: "name", label: "Filename", icon: ImageIcon },
];

const OPERATOR_OPTIONS = {
    aspectRatio: [
        { value: "equals", label: "is" },
        { value: "notEquals", label: "is not" },
    ],
    name: [
        { value: "contains", label: "contains" },
        { value: "startsWith", label: "starts with" },
        { value: "endsWith", label: "ends with" },
    ]
};

const VALUE_OPTIONS = {
    aspectRatio: ["Square", "Portrait", "Landscape", "Story"],
};

export function RulesEngine({ onClose }) {
    const { getRules, addRule, updateRule, deleteRule, getTemplates } = useStore();
    const rules = getRules();
    const templates = getTemplates();

    const [newRule, setNewRule] = useState(null);

    const handleCreate = () => {
        setNewRule({
            field: "aspectRatio",
            operator: "equals",
            value: "Portrait",
            templateId: templates[0]?.id || "",
            isActive: true
        });
    };

    const handleSaveNew = () => {
        if (!newRule.templateId) return alert("Please select a template");
        addRule(newRule);
        setNewRule(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden max-w-3xl w-full flex flex-col max-h-[85vh] shadow-[0_0_50px_rgba(190,24,93,0.15)]"
            >
                {/* Header */}
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-pink-500/5 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                            <Zap className="text-pink-500" size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold font-syne text-2xl text-white tracking-tight">Smart Automations</h3>
                            <p className="text-white/40 text-sm">Tell us how to handle your images automatically</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* List Existing Rules */}
                    <AnimatePresence mode="popLayout">
                        {rules.length === 0 && !newRule && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]"
                            >
                                <Sparkles className="mx-auto text-pink-500/20 mb-4" size={48} />
                                <p className="text-white/40 mb-6">No magic recipes yet. Create one to save time!</p>
                                <GlassButton onClick={handleCreate} className="bg-pink-500/10 border-pink-500/20 text-pink-400 px-6 mx-auto">
                                    <Plus size={18} className="mr-2" /> Create My First Automation
                                </GlassButton>
                            </motion.div>
                        )}

                        {rules.map((rule) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={rule.id}
                                className="p-5 bg-white/[0.03] rounded-2xl border border-white/10 flex items-center justify-between group hover:border-pink-500/30 transition-all duration-300"
                            >
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/40 uppercase tracking-widest">When</div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-medium">{FIELD_OPTIONS.find(f => f.value === rule.field)?.label}</span>
                                        <span className="text-pink-400 font-syne lowercase">{OPERATOR_OPTIONS[rule.field]?.find(o => o.value === rule.operator)?.label}</span>
                                        <span className="bg-pink-500/10 text-pink-200 px-3 py-1 rounded-lg border border-pink-500/20 font-bold">
                                            {rule.value}
                                        </span>
                                    </div>

                                    <ArrowRight className="text-white/20 mx-2" size={20} />

                                    <div className="px-3 py-1 rounded-full bg-purple-500/5 border border-purple-500/10 text-xs font-bold text-purple-400/60 uppercase tracking-widest">Use</div>
                                    <span className="bg-purple-500/10 text-purple-200 px-3 py-1 rounded-lg border border-purple-500/20 font-bold">
                                        {templates.find(t => t.id === rule.templateId)?.name || "Template"}
                                    </span>
                                </div>

                                <button
                                    onClick={() => deleteRule(rule.id)}
                                    className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all p-2 hover:bg-red-500/10 rounded-xl"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </motion.div>
                        ))}

                        {/* New Rule Form */}
                        {newRule && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-pink-500/[0.05] rounded-3xl border border-pink-500/20 space-y-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]"
                            >
                                <div className="flex items-center justify-between">
                                    <h4 className="text-pink-400 font-bold flex items-center gap-2 tracking-wide">
                                        <Sparkles size={16} /> NEW AUTOMATION RECIPE
                                    </h4>
                                    <button onClick={() => setNewRule(null)} className="text-white/30 hover:text-white uppercase text-[10px] font-bold tracking-widest px-2 py-1 rounded-md hover:bg-white/5">Cancel</button>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-white">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">When an image's</span>
                                        <select
                                            value={newRule.field}
                                            onChange={e => setNewRule({ ...newRule, field: e.target.value, operator: OPERATOR_OPTIONS[e.target.value][0].value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-2 focus:border-pink-500 outline-none hover:border-white/20 transition-colors"
                                        >
                                            {FIELD_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Condition</span>
                                        <select
                                            value={newRule.operator}
                                            onChange={e => setNewRule({ ...newRule, operator: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-2 focus:border-pink-500 outline-none hover:border-white/20 transition-colors"
                                        >
                                            {OPERATOR_OPTIONS[newRule.field].map(o => <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>)}
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Value</span>
                                        {newRule.field === 'aspectRatio' ? (
                                            <select
                                                value={newRule.value}
                                                onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                                                className="bg-black border border-white/10 rounded-xl px-4 py-2 focus:border-pink-500 outline-none hover:border-white/20 transition-colors"
                                            >
                                                {VALUE_OPTIONS.aspectRatio.map(v => <option key={v} value={v} className="bg-[#111]">{v}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={newRule.value}
                                                onChange={e => setNewRule({ ...newRule, value: e.target.value })}
                                                placeholder="e.g. banner-v2"
                                                className="bg-black border border-white/10 rounded-xl px-4 py-2 focus:border-pink-500 outline-none hover:border-white/20 transition-colors w-40"
                                            />
                                        )}
                                    </div>

                                    <div className="h-10 w-[1px] bg-white/10 mx-2 self-end mb-1" />

                                    <div className="flex flex-col gap-2 flex-grow">
                                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/30 ml-1">Apply this template</span>
                                        <select
                                            value={newRule.templateId}
                                            onChange={e => setNewRule({ ...newRule, templateId: e.target.value })}
                                            className="bg-black border border-white/10 rounded-xl px-4 py-2 focus:border-purple-500 outline-none hover:border-white/20 transition-colors"
                                        >
                                            <option value="" disabled className="bg-[#111]">Select template...</option>
                                            {templates.map(t => <option key={t.id} value={t.id} className="bg-[#111]">{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 border-t border-pink-500/10">
                                    <button
                                        onClick={handleSaveNew}
                                        className="bg-pink-600 hover:bg-pink-500 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-pink-600/20 active:scale-95 flex items-center gap-2"
                                    >
                                        <Save size={18} /> Enable Automation
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-white/5 bg-white/[0.01] flex justify-between items-center gap-4">
                    <button
                        onClick={handleCreate}
                        disabled={!!newRule}
                        className={cn(
                            "group flex items-center gap-2 px-6 py-3 rounded-2xl transition-all duration-300",
                            newRule
                                ? "bg-white/5 border border-white/5 text-white/20 cursor-not-allowed"
                                : "bg-white/5 border border-white/10 text-white/60 hover:bg-pink-500/10 hover:border-pink-500/30 hover:text-pink-400"
                        )}
                    >
                        <Plus size={18} className={cn("transition-transform group-hover:rotate-90", !newRule && "text-pink-500")} />
                        <span className="font-bold">New Recipe</span>
                    </button>

                    <button
                        onClick={onClose}
                        className="px-10 py-3 bg-white text-black rounded-2xl font-extrabold hover:bg-white/90 transition-all active:scale-95 shadow-xl shadow-white/5"
                    >
                        Ready to Go
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
