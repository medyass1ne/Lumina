import { cn } from "@/lib/utils";

export function GlassButton({ className, children, ...props }) {
    return (
        <button
            className={cn(
                "glass-button px-6 py-2 rounded-full text-white font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
}
