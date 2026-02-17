
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import { getCroppedImg } from '../utils';
import { XIcon, CheckIcon } from './Icons';

// Type for crop points
interface CropperState {
    x: number;
    y: number;
}

// Type for cropped area in pixels
interface CroppedAreaPixels {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropperProps {
    imageSrc: string;
    onCancel: () => void;
    onComplete: (croppedImageBase64: string) => void;
}

const ImageCropper = ({ imageSrc, onCancel, onComplete }: ImageCropperProps) => {
    const [crop, setCrop] = useState<CropperState>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState<number | undefined>(undefined); // undefined = freeform
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

    const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: CroppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        try {
            const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
            onComplete(croppedImage);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="cropper-overlay">
            <div className="cropper-container">
                <div className="cropper-area">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        objectFit="contain"
                    />
                </div>
                
                <div className="cropper-controls">
                    <div className="slider-container">
                        <span style={{fontSize: '0.8rem', opacity: 0.7}}>Zoom</span>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="zoom-range"
                        />
                    </div>

                    <div className="aspect-toggles">
                        <button 
                            className={`aspect-btn ${aspect === undefined ? 'active' : ''}`}
                            onClick={() => setAspect(undefined)}
                        >
                            Free
                        </button>
                        <button 
                            className={`aspect-btn ${aspect === 1 ? 'active' : ''}`}
                            onClick={() => setAspect(1)}
                        >
                            1:1
                        </button>
                         <button 
                            className={`aspect-btn ${aspect === 16/9 ? 'active' : ''}`}
                            onClick={() => setAspect(16/9)}
                        >
                            16:9
                        </button>
                    </div>

                    <div className="cropper-actions">
                        <button className="cropper-btn cancel" onClick={onCancel}>
                            <XIcon /> Cancel
                        </button>
                        <button className="cropper-btn save" onClick={handleSave}>
                            <CheckIcon /> Apply
                        </button>
                    </div>
                </div>
            </div>
            
            <style>{`
                .cropper-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: #000;
                    z-index: 9999;
                    display: flex; flex-direction: column;
                    animation: fadeIn 0.3s ease;
                }
                .cropper-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                .cropper-area {
                    flex: 1;
                    position: relative;
                    background: #111;
                }
                .cropper-controls {
                    background: #18181b;
                    padding: 24px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .slider-container {
                    display: flex; align-items: center; gap: 12px;
                    color: white;
                }
                .zoom-range {
                    flex: 1;
                    -webkit-appearance: none;
                    height: 4px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 2px;
                    outline: none;
                }
                .zoom-range::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px; height: 16px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .aspect-toggles {
                    display: flex; justify-content: center; gap: 8px;
                }
                .aspect-btn {
                    background: transparent; border: 1px solid rgba(255,255,255,0.2);
                    color: rgba(255,255,255,0.6);
                    padding: 6px 12px; border-radius: 99px;
                    font-size: 0.85rem; cursor: pointer;
                }
                .aspect-btn.active {
                    background: rgba(255,255,255,0.1);
                    color: #fff; border-color: #fff;
                }
                .cropper-actions {
                    display: flex; justify-content: space-between; gap: 12px;
                    margin-top: 8px;
                }
                .cropper-btn {
                    flex: 1; padding: 12px; border-radius: 8px;
                    border: none; cursor: pointer; font-weight: 600;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                }
                .cropper-btn.cancel {
                    background: rgba(255,255,255,0.1); color: #fff;
                }
                .cropper-btn.save {
                    background: #fff; color: #000;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default ImageCropper;
