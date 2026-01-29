"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { GlassButton } from "@/components/ui/GlassButton";
import { Slider } from "@/components/ui/Slider";
import { FileInput } from "@/components/ui/FileInput";
import { Download, Type, Trash2, Bold, Italic, Underline } from "lucide-react";
import { cn } from "@/lib/utils";

const FONT_FAMILIES = [
  "Arial",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Verdana",
  "Impact",
  "Comic Sans MS"
];

export function WatermarkCanvas({ onExport }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvas, setCanvas] = useState(null);
  const [selectedObj, setSelectedObj] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [opacity, setOpacity] = useState(1);
  const [color, setColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || canvas) return;

    const c = new fabric.Canvas(canvasRef.current, {
      height: 600,
      width: 800,
      backgroundColor: null,
    });
    setCanvas(c);

    const resizeCanvas = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = width * 0.75;
        c.setDimensions({ width, height });
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const updateControls = (e) => {
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
      window.removeEventListener("resize", resizeCanvas);
      c.dispose();
    };
  }, []);

  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;

    dragCounter.current -= 1;

    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (!canvas) return;

    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (f) => {
          fabric.Image.fromURL(f.target.result, (img) => {
            img.scaleToWidth(200);
            img.set({
              left: canvas.width / 2 - 100,
              top: canvas.height / 2 - 100,
            });
            canvas.add(img);
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
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        img.scaleToWidth(150);
        canvas.add(img);
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (!canvas) return;
    const text = new fabric.IText("Watermark", {
      left: 100,
      top: 100,
      fontFamily: "Arial",
      fill: "#ffffff",
      fontSize: 40,
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const updateOpacity = (val) => {
    setOpacity(val);
    if (selectedObj) {
      selectedObj.set("opacity", val);
      canvas.requestRenderAll();
    }
  };

  const updateColor = (val) => {
    setColor(val);
    if (selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text')) {
      selectedObj.set("fill", val);
      canvas.requestRenderAll();
    }
  };

  const updateFontFamily = (val) => {
    setFontFamily(val);
    if (selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text')) {
      selectedObj.set("fontFamily", val);
      canvas.requestRenderAll();
    }
  };

  const toggleBold = () => {
    const newVal = !isBold;
    setIsBold(newVal);
    if (selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text')) {
      selectedObj.set("fontWeight", newVal ? 'bold' : 'normal');
      canvas.requestRenderAll();
    }
  };

  const toggleItalic = () => {
    const newVal = !isItalic;
    setIsItalic(newVal);
    if (selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text')) {
      selectedObj.set("fontStyle", newVal ? 'italic' : 'normal');
      canvas.requestRenderAll();
    }
  };

  const toggleUnderline = () => {
    const newVal = !isUnderline;
    setIsUnderline(newVal);
    if (selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text')) {
      selectedObj.set("underline", newVal);
      canvas.requestRenderAll();
    }
  };

  const deleteSelected = () => {
    if (canvas && selectedObj) {
      canvas.remove(selectedObj);
      canvas.discardActiveObject();
      canvas.requestRenderAll();
      setSelectedObj(null);
    }
  };

  const downloadImage = () => {
    if (!canvas) return;
    const dataURL = canvas.toDataURL({
      format: "png",
      quality: 1,
      multiplier: 2,
    });

    // const link = document.createElement("a");
    // link.download = "template-layer.png";
    // link.href = dataURL;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);

    if (onExport) onExport(dataURL);
  };

  const isText = selectedObj && (selectedObj.type === 'i-text' || selectedObj.type === 'text');

  return (
    <div className="flex flex-col gap-4 w-full max-w-5xl mx-auto p-4">
      <div
        ref={containerRef}
        className={cn(
          "flex justify-center rounded-xl border-2 transition-colors relative overflow-hidden",
          isDragging ? "border-pink-500 bg-pink-500/10" : "border-white/5 bg-black/30"
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        />

        <div className="relative z-10 shadow-2xl">
          <canvas ref={canvasRef} />
        </div>

        {isDragging && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <p className="text-2xl font-bold text-white pointer-events-none">Drop images here</p>
          </div>
        )}
      </div>

      <div className="glass-panel p-4 rounded-xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <span className="text-pink-200/50 text-sm font-medium mr-2 hidden md:inline-block">
              Drag & Drop images or:
            </span>
            <FileInput label="Add Image" onFileSelect={addLogo} />
            <GlassButton onClick={addText} className="bg-white/10 hover:bg-white/20 px-4">
              <Type size={18} className="mr-2" /> Add Text
            </GlassButton>
            <div className="ml-auto">
              <GlassButton onClick={downloadImage} className="bg-pink-600 hover:bg-pink-500">
                <Download size={18} className="mr-2" /> Export Template
              </GlassButton>
            </div>
          </div>

          <div className="min-h-[60px] flex flex-wrap items-center gap-6">
            {!selectedObj && <span className="text-white/30 text-sm italic">Select an element to edit</span>}

            {selectedObj && (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-xs uppercase tracking-wider font-bold">Opacity</span>
                  <div className="w-24">
                    <Slider value={opacity} min={0} max={1} step={0.01} onChange={updateOpacity} />
                  </div>
                </div>

                {isText && (
                  <div className="flex items-center gap-4 border-l border-white/20 pl-4">
                    <div className="flex items-center gap-2" title="Text Color">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/30">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => updateColor(e.target.value)}
                          className="absolute inset-0 w-[150%] h-[150%] -top-[25%] -left-[25%] cursor-pointer p-0 border-0"
                        />
                      </div>
                    </div>
                    <select
                      value={fontFamily}
                      onChange={(e) => updateFontFamily(e.target.value)}
                      className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-pink-500"
                    >
                      {FONT_FAMILIES.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                    <div className="flex items-center bg-black/20 rounded-lg p-1">
                      <button onClick={toggleBold} className={cn("p-1.5 rounded transition-colors", isBold ? "bg-white/20 text-white" : "text-white/50 hover:text-white")} title="Bold"><Bold size={16} /></button>
                      <button onClick={toggleItalic} className={cn("p-1.5 rounded transition-colors", isItalic ? "bg-white/20 text-white" : "text-white/50 hover:text-white")} title="Italic"><Italic size={16} /></button>
                      <button onClick={toggleUnderline} className={cn("p-1.5 rounded transition-colors", isUnderline ? "bg-white/20 text-white" : "text-white/50 hover:text-white")} title="Underline"><Underline size={16} /></button>
                    </div>
                  </div>
                )}

                <div className="ml-auto pl-4 border-l border-white/10">
                  <button onClick={deleteSelected} className="text-red-400 hover:text-red-300 p-2 transition-colors hover:bg-red-500/10 rounded-full" title="Delete Element"><Trash2 size={20} /></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
