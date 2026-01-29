"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { GlassButton } from "@/components/ui/GlassButton";
import { Slider } from "@/components/ui/Slider";
import { FileInput } from "@/components/ui/FileInput";
import { Download, Type, Trash2, Bold, Italic, Underline, Save, LayoutTemplate, Smartphone, Maximize } from "lucide-react";
import { cn } from "@/lib/utils";

const FONT_FAMILIES = [
    "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact", "Comic Sans MS", "Syne"
];

const ASPECT_RATIOS = {
    "Square": { width: 800, height: 800, label: "Square (1:1)" },
    "Portrait": { width: 800, height: 1000, label: "Portrait (4:5)" },
    "Landscape": { width: 800, height: 418, label: "Landscape (1.91:1)" },
    "Story": { width: 600, height: 1066, label: "Story (9:16)" },
    "Custom": { width: 800, height: 800, label: "Custom" }
};

export function TemplateEditor({ initialTemplate, onSave, onCancel }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const viewportRef = useRef(null);
    const [canvas, setCanvas] = useState(null);
    const [selectedObj, setSelectedObj] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showSafeZones, setShowSafeZones] = useState(false);

    // ... (keep existing state)



    const [aspectRatio, setAspectRatio] = useState(initialTemplate?.aspectRatio || "Square");
    const [templateName, setTemplateName] = useState(initialTemplate?.name || "New Template");
    const [customSize, setCustomSize] = useState({
        width: initialTemplate?.width || 800,
        height: initialTemplate?.height || 800
    });

    const getDimensions = () => {
        if (aspectRatio === 'Custom') return customSize;
        return ASPECT_RATIOS[aspectRatio];
    };

    const [opacity, setOpacity] = useState(1);
    const [color, setColor] = useState("#ffffff");
    const [fontFamily, setFontFamily] = useState("Arial");
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);

    useEffect(() => {
        if (!canvasRef.current || canvas) return;

        let isMounted = true;
        const { width, height } = getDimensions();

        const c = new fabric.Canvas(canvasRef.current, {
            height: height,
            width: width,
            backgroundColor: null,
        });
        setCanvas(c);

        if (initialTemplate?.jsonState && initialTemplate.jsonState.objects && initialTemplate.jsonState.objects.length > 0) {
            try {
                c.loadFromJSON(initialTemplate.jsonState, () => {
                    if (!isMounted) return;

                    if (c.getObjects().length > 0) {
                        c.renderAll();
                    }

                    window.dispatchEvent(new Event('resize'));
                });
            } catch (e) {
                console.error("Failed to load JSON state:", e);
            }
        } else if (initialTemplate?.previewUrl) {
            console.log("Loading template from URL:", initialTemplate.previewUrl);

            const imgEl = new Image();
            imgEl.crossOrigin = "anonymous";
            imgEl.referrerPolicy = "no-referrer";

            imgEl.onload = () => {
                if (!isMounted) return;
                console.log("Template image loaded successfully");

                const img = new fabric.Image(imgEl);

                const scaleX = width / img.width;
                const scaleY = height / img.height;

                img.set({
                    scaleX: scaleX,
                    scaleY: scaleY,
                    originX: 'left',
                    originY: 'top',
                    left: 0,
                    top: 0,
                    selectable: false
                });

                c.add(img);
                c.sendToBack(img);
                c.renderAll();
            };

            imgEl.onerror = (err) => {
                console.error("Failed to load template image:", err);
            };

            imgEl.src = initialTemplate.previewUrl;
        } else {
            console.warn("No jsonState or previewUrl found for template", initialTemplate);
        }

        const updateControls = (e) => {
            if (!isMounted) return;
            const obj = e.selected ? e.selected[0] : null;
            setSelectedObj(obj);
            if (obj) {
                setOpacity(obj.opacity || 1);
                if (obj.type === 'i-text' || obj.type === 'text') {
                    setColor(obj.fill);
                    setFontFamily(obj.fontFamily);
                    setIsBold(obj.fontWeight === 'bold');
                    setIsItalic(obj.fontStyle === 'italic');
                    setIsUnderline(obj.underline || false);
                }
            }
        };

        c.on("selection:created", updateControls);
        c.on("selection:updated", updateControls);
        c.on("selection:cleared", () => setSelectedObj(null));

        return () => {
            isMounted = false;
            c.dispose();
            setCanvas(null);
        };
    }, [canvasRef, initialTemplate]);

    // Handle Resize (Recreated when dependencies change to avoid stale closures)
    const resizeCanvas = useCallback(() => {
        if (viewportRef.current && containerRef.current && canvas) {
            const viewportWidth = viewportRef.current.clientWidth;
            const viewportHeight = viewportRef.current.clientHeight;
            const targetDim = getDimensions();

            const padding = 40;
            const availableWidth = Math.max(100, viewportWidth - padding);
            const availableHeight = Math.max(100, viewportHeight - padding);

            const scaleX = availableWidth / targetDim.width;
            const scaleY = availableHeight / targetDim.height;

            // Fit strictly within container (contain)
            const scale = Math.min(scaleX, scaleY);

            const finalScale = scale;

            const scaledWidth = targetDim.width * finalScale;
            const scaledHeight = targetDim.height * finalScale;

            containerRef.current.style.width = `${scaledWidth}px`;
            containerRef.current.style.height = `${scaledHeight}px`;

            canvas.setDimensions({
                width: scaledWidth,
                height: scaledHeight
            });
            canvas.setZoom(finalScale);
        }
    }, [canvas, aspectRatio, customSize]);

    useEffect(() => {
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    useEffect(() => {
        if (!canvas) return;
        const { width, height } = getDimensions();
        canvas.setDimensions({ width, height });
        window.dispatchEvent(new Event('resize'));
    }, [aspectRatio, customSize, canvas]);


    const handleSave = () => {
        if (!canvas) return;

        const previewUrl = canvas.toDataURL({
            format: "png",
            quality: 0.8,
            multiplier: 1,
        });

        const highResUrl = canvas.toDataURL({
            format: "png",
            quality: 1,
            multiplier: 3,
        });

        // 3. Export State (JSON)
        let jsonState = canvas.toJSON();

        if (jsonState && jsonState.objects) {
            jsonState.objects = jsonState.objects.map(obj => {
                if (obj.type === 'image' && obj.src && obj.src.startsWith('blob:')) {


                    return { ...obj };
                }
                return obj;
            });
        }

        onSave({
            name: templateName,
            aspectRatio,
            width: getDimensions().width,
            height: getDimensions().height,
            previewUrl,
            highResUrl,
            jsonState,
        });
    };

    const dragCounter = useRef(0);
    const handleDragEnter = useCallback((e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.items?.length > 0) setIsDragging(true); }, []);
    const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; setIsDragging(true); }, []);
    const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current === 0) setIsDragging(false); }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false); dragCounter.current = 0;
        if (!canvas) return;
        Array.from(e.dataTransfer.files).forEach((file) => {
            if (file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = (f) => {
                    fabric.Image.fromURL(f.target.result, (img) => {
                        img.scaleToWidth(200);
                        canvas.add(img);
                        canvas.centerObject(img);
                        canvas.setActiveObject(img);
                    });
                };
                reader.readAsDataURL(file);
            }
        });
    }, [canvas]);

    const addLogo = (file) => {
        if (!canvas) return;
        const reader = new FileReader();
        reader.onload = (f) => fabric.Image.fromURL(f.target.result, (img) => {
            img.scaleToWidth(150);
            canvas.add(img);
            canvas.centerObject(img);
            canvas.setActiveObject(img);
        });
        reader.readAsDataURL(file);
    };

    const addText = () => {
        if (!canvas) return;
        const text = new fabric.IText("Watermark", { left: 100, top: 100, fontFamily: "Arial", fill: "#ffffff", fontSize: 40 });
        canvas.add(text);
        canvas.centerObject(text);
        canvas.setActiveObject(text);
    };

    const deleteSelected = () => {
        if (canvas?.getActiveObject()) { canvas.remove(canvas.getActiveObject()); canvas.discardActiveObject(); canvas.requestRenderAll(); setSelectedObj(null); }
    };

    const updateProp = (prop, val) => {
        if (selectedObj) { selectedObj.set(prop, val); canvas.requestRenderAll(); }
    };

    const isText = selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text');

    return (
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-xl">
            {/* Toolbar Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex items-center gap-4">
                    <input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="bg-transparent border-none text-xl font-bold text-white focus:ring-0 placeholder-white/30"
                        placeholder="Template Name"
                    />
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm text-white/70 focus:text-white outline-none"
                    >
                        {Object.entries(ASPECT_RATIOS).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {aspectRatio === 'Custom' && (
                        <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
                            <div className="flex items-center gap-1">
                                <span className="text-white/30 text-xs">W:</span>
                                <input
                                    type="number"
                                    value={customSize.width}
                                    onChange={(e) => setCustomSize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                                    className="w-16 bg-transparent border border-white/10 rounded px-1 text-sm text-white focus:border-pink-500/50 outline-none text-center"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-white/30 text-xs">H:</span>
                                <input
                                    type="number"
                                    value={customSize.height}
                                    onChange={(e) => setCustomSize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                                    className="w-16 bg-transparent border border-white/10 rounded px-1 text-sm text-white focus:border-pink-500/50 outline-none text-center"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <GlassButton onClick={() => setShowSafeZones(!showSafeZones)} className={cn("px-3", showSafeZones && "bg-blue-500/20 text-blue-300")}>
                        <Maximize size={16} className="mr-2" /> Safe Zones
                    </GlassButton>
                    <GlassButton onClick={onCancel} className="bg-white/10 hover:bg-white/20">Cancel</GlassButton>
                    <GlassButton onClick={handleSave} className="bg-pink-600 hover:bg-pink-500">
                        <Save size={16} className="mr-2" /> Save Template
                    </GlassButton>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Toolkit */}
                <div className="w-16 flex flex-col items-center gap-4 py-6 border-r border-white/10 bg-black/20 z-10">
                    <FileInput label="" onFileSelect={addLogo} className="hidden" />
                    <button onClick={addText} className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors" title="Add Text">
                        <Type size={20} />
                    </button>
                    {/* More tools could go here */}
                </div>

                {/* Canvas Area */}
                <div ref={viewportRef} className="flex-1 overflow-hidden flex items-center justify-center p-8 bg-[#111] relative">

                    <div
                        ref={containerRef}
                        className="relative shadow-2xl transition-all duration-300 transform-gpu"
                        style={{
                        }}
                        onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}
                    >
                        {/* Safe Zones Overlay */}
                        {showSafeZones && (
                            <div className="absolute inset-0 pointer-events-none z-20 border-2 border-blue-500/30">
                                {/* Example Instagram Story Safe Zones */}
                                {aspectRatio === 'Story' && (
                                    <>
                                        <div className="absolute top-[250px] bottom-[250px] left-0 right-0 border-y border-blue-500/20 bg-blue-500/5"></div>
                                    </>
                                )}
                                <div className="absolute top-1/2 left-0 w-full h-px bg-blue-400/20"></div>
                                <div className="absolute top-0 left-1/2 h-full w-px bg-blue-400/20"></div>
                            </div>
                        )}

                        {/* Drag Overlay */}
                        {isDragging && (
                            <div className="absolute inset-0 z-30 bg-pink-500/20 border-2 border-pink-500 flex items-center justify-center backdrop-blur-sm">
                                <p className="font-bold text-white text-xl">Drop Assets Here</p>
                            </div>
                        )}

                        <div className="bg-[url('https://transparenttextures.com/patterns/stardust.png')] bg-white/5 absolute inset-0"></div>
                        <canvas ref={canvasRef} />
                    </div>
                </div>

                {/* Right Properties Panel */}
                <div className="w-72 border-l border-white/10 bg-black/20 p-4 overflow-y-auto z-10">
                    {!selectedObj ? (
                        <div className="text-center text-white/30 mt-10">
                            <LayoutTemplate size={32} className="mx-auto mb-2" />
                            <p>Select an element to edit properties</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Common */}
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Opacity</label>
                                <Slider value={opacity} min={0} max={1} step={0.01} onChange={(v) => { setOpacity(v); updateProp('opacity', v); }} />
                            </div>

                            {/* Text Specific */}
                            {isText && (
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Typography</label>
                                        <select
                                            value={fontFamily}
                                            onChange={(e) => { setFontFamily(e.target.value); updateProp('fontFamily', e.target.value); }}
                                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-sm mb-2"
                                        >
                                            {FONT_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setIsBold(!isBold); updateProp('fontWeight', !isBold ? 'bold' : 'normal'); }} className={cn("p-2 rounded flex-1", isBold ? "bg-white/20" : "bg-white/5 hover:bg-white/10")}><Bold size={16} className="mx-auto" /></button>
                                            <button onClick={() => { setIsItalic(!isItalic); updateProp('fontStyle', !isItalic ? 'italic' : 'normal'); }} className={cn("p-2 rounded flex-1", isItalic ? "bg-white/20" : "bg-white/5 hover:bg-white/10")}><Italic size={16} className="mx-auto" /></button>
                                            <button onClick={() => { setIsUnderline(!isUnderline); updateProp('underline', !isUnderline); }} className={cn("p-2 rounded flex-1", isUnderline ? "bg-white/20" : "bg-white/5 hover:bg-white/10")}><Underline size={16} className="mx-auto" /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">Color</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); updateProp('fill', e.target.value); }} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                            <span className="text-xs text-white/50">{color}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-white/10">
                                <button onClick={deleteSelected} className="w-full flex items-center justify-center gap-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded-lg transition-colors">
                                    <Trash2 size={16} /> Remove Element
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
