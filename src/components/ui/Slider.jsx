import { cn } from "@/lib/utils";

export function Slider({ className, value, min = 0, max = 100, step = 1, onChange, ...props }) {
    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className={cn(
                "w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-600 hover:accent-pink-500",
                className
            )}
            {...props}
        />
    );
}
