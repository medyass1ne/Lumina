
import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw, ZoomIn } from 'lucide-react';
import { getCroppedImg } from '@/lib/image-processor';
import { GlassButton } from '@/components/ui/GlassButton';
import { ASPECT_RATIO_TYPES } from '@/lib/auto-detector';

export default function ImageEditorModal({ isOpen, onClose, imageSrc, onSave, classification }) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const aspectConfig = ASPECT_RATIO_TYPES[classification?.toUpperCase()];
    const lockAspectRatio = aspectConfig ? aspectConfig.ratio : undefined;

    const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            setIsProcessing(true);
            const croppedImageBlob = await getCroppedImg(
                imageSrc,
                croppedAreaPixels,
                rotation
            );
            const previewUrl = URL.createObjectURL(croppedImageBlob);

            onSave(croppedImageBlob, previewUrl);
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen || !imageSrc) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl h-[80vh] bg-neutral-900/90 border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-neutral-950/50">
                    <h3 className="text-lg font-semibold text-white">
                        Edit Image
                        {classification && <span className="ml-2 text-sm font-normal text-white/50">({classification} Locked)</span>}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Editor Area */}
                <div className="relative flex-1 bg-neutral-950 overflow-hidden">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={lockAspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        objectFit="contain"
                    />
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-white/10 bg-neutral-900 flex flex-col gap-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Zoom Control */}
                        <div className="flex items-center gap-3">
                            <ZoomIn size={18} className="text-neutral-400" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>

                        {/* Rotation Control */}
                        <div className="flex items-center gap-3">
                            <RotateCw size={18} className="text-neutral-400" />
                            <input
                                type="range"
                                value={rotation}
                                min={0}
                                max={360}
                                step={1}
                                aria-labelledby="Rotation"
                                onChange={(e) => setRotation(Number(e.target.value))}
                                className="w-full h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <GlassButton
                            onClick={onClose}
                            variant="secondary"
                            disabled={isProcessing}
                        >
                            Cancel
                        </GlassButton>
                        <GlassButton
                            onClick={handleSave}
                            variant="primary"
                            disabled={isProcessing}
                            className="w-32 justify-center"
                        >
                            {isProcessing ? 'Saving...' : (
                                <>
                                    <Check size={18} className="mr-2" />
                                    Save
                                </>
                            )}
                        </GlassButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
