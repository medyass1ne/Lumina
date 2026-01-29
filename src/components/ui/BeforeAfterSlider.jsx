
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { UnfoldHorizontal } from 'lucide-react';

export function BeforeAfterSlider({ beforeSrc, afterSrc, className }) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    const handleMove = useCallback((clientX) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percent = (x / rect.width) * 100;
        setSliderPosition(percent);
    }, []);

    const onMouseDown = () => setIsDragging(true);
    const onTouchStart = () => setIsDragging(true);

    useEffect(() => {
        const handleMouseUp = () => setIsDragging(false);
        const handleMouseMove = (e) => {
            if (isDragging) handleMove(e.clientX);
        };
        const handleTouchMove = (e) => {
            if (isDragging) handleMove(e.touches[0].clientX);
        };

        if (isDragging) {
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
        }

        return () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isDragging, handleMove]);

    const handleContainerClick = (e) => {
        handleMove(e.clientX);
    };

    return (
        <div
            ref={containerRef}
            className={cn("relative w-full h-full overflow-hidden cursor-col-resize select-none touch-none group", className)}
            onMouseDown={handleContainerClick}
        >
            {/* Before Image (Background) */}
            <img
                src={beforeSrc}
                alt="Before"
                className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
            />
            <div className="absolute top-4 left-4 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-bold text-white/50 pointer-events-none z-10">
                ORIGINAL
            </div>

            {/* After Image (Foreground, clipped) */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
            >
                <img
                    src={afterSrc}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                />
                <div className="absolute top-4 right-4 px-2 py-1 bg-pink-500/80 backdrop-blur-md rounded text-xs font-bold text-white pointer-events-none">
                    ENHANCED
                </div>
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-black">
                    <UnfoldHorizontal size={14} />
                </div>
            </div>
        </div>
    );
}
