/**
 * BrandKitEditor - Create and manage brand kits for consistent design generation
 */

import React, { useState, useEffect } from 'react';
import type { BrandKit } from '../types';
import { generateId } from '../utils';
import { XIcon, CheckIcon, PaletteIcon } from './Icons';

interface BrandKitEditorProps {
    isOpen: boolean;
    onClose: () => void;
    currentBrandKit: BrandKit | null;
    onSave: (brandKit: BrandKit) => void;
    onDelete?: (id: string) => void;
}

const FONT_OPTIONS = [
    { value: 'Inter', label: 'Inter - Modern Sans' },
    { value: 'Playfair Display', label: 'Playfair Display - Elegant Serif' },
    { value: 'Roboto', label: 'Roboto - Clean Sans' },
    { value: 'Poppins', label: 'Poppins - Geometric Sans' },
    { value: 'Montserrat', label: 'Montserrat - Strong Sans' },
    { value: 'Lora', label: 'Lora - Classic Serif' },
    { value: 'Space Grotesk', label: 'Space Grotesk - Tech Sans' },
    { value: 'DM Sans', label: 'DM Sans - Friendly Sans' },
    { value: 'Crimson Pro', label: 'Crimson Pro - Editorial Serif' },
    { value: 'Work Sans', label: 'Work Sans - Versatile Sans' },
];

const COLOR_PRESETS = [
    { name: 'Professional Blue', primary: '#1e40af', secondary: '#3b82f6', accent: '#60a5fa' },
    { name: 'Elegant Dark', primary: '#18181b', secondary: '#27272a', accent: '#fafafa' },
    { name: 'Warm Earth', primary: '#78350f', secondary: '#a16207', accent: '#fbbf24' },
    { name: 'Fresh Green', primary: '#14532d', secondary: '#15803d', accent: '#4ade80' },
    { name: 'Royal Purple', primary: '#581c87', secondary: '#7c3aed', accent: '#a78bfa' },
    { name: 'Coral Sunset', primary: '#9f1239', secondary: '#f43f5e', accent: '#fda4af' },
];

export default function BrandKitEditor({ 
    isOpen, 
    onClose, 
    currentBrandKit, 
    onSave, 
    onDelete 
}: BrandKitEditorProps) {
    const [name, setName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#1e40af');
    const [secondaryColor, setSecondaryColor] = useState('#3b82f6');
    const [accentColor, setAccentColor] = useState('#60a5fa');
    const [fontFamily, setFontFamily] = useState('Inter');
    const [logoUrl, setLogoUrl] = useState('');
    
    // Reset form when modal opens or brand kit changes
    useEffect(() => {
        if (isOpen) {
            if (currentBrandKit) {
                setName(currentBrandKit.name);
                setPrimaryColor(currentBrandKit.primaryColor);
                setSecondaryColor(currentBrandKit.secondaryColor);
                setAccentColor(currentBrandKit.accentColor);
                setFontFamily(currentBrandKit.fontFamily);
                setLogoUrl(currentBrandKit.logoUrl || '');
            } else {
                setName('');
                setPrimaryColor('#1e40af');
                setSecondaryColor('#3b82f6');
                setAccentColor('#60a5fa');
                setFontFamily('Inter');
                setLogoUrl('');
            }
        }
    }, [isOpen, currentBrandKit]);
    
    const handleSave = () => {
        if (!name.trim()) return;
        
        const brandKit: BrandKit = {
            id: currentBrandKit?.id || generateId(),
            name: name.trim(),
            primaryColor,
            secondaryColor,
            accentColor,
            fontFamily,
            logoUrl: logoUrl.trim() || undefined,
        };
        
        onSave(brandKit);
        onClose();
    };
    
    const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
        setPrimaryColor(preset.primary);
        setSecondaryColor(preset.secondary);
        setAccentColor(preset.accent);
    };
    
    const handleDelete = () => {
        if (currentBrandKit && onDelete) {
            if (confirm(`Delete brand kit "${currentBrandKit.name}"?`)) {
                onDelete(currentBrandKit.id);
                onClose();
            }
        }
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="publish-modal-header">
                    <h2>{currentBrandKit ? 'Edit Brand Kit' : 'Create Brand Kit'}</h2>
                    <button className="close-button" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>
                
                <div className="publish-modal-body">
                    <div className="brand-kit-form">
                        <div className="form-group">
                            <label>Brand Kit Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Acme Corp"
                            />
                        </div>
                        
                        {/* Color Presets */}
                        <div className="form-group">
                            <label>Quick Presets</label>
                            <div className="color-presets">
                                {COLOR_PRESETS.map(preset => (
                                    <button
                                        key={preset.name}
                                        className="color-preset"
                                        onClick={() => applyPreset(preset)}
                                        title={preset.name}
                                    >
                                        <span style={{ background: preset.primary }}></span>
                                        <span style={{ background: preset.secondary }}></span>
                                        <span style={{ background: preset.accent }}></span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        {/* Color Inputs */}
                        <div className="color-inputs">
                            <div className="form-group">
                                <label>Primary Color</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={primaryColor}
                                        onChange={(e) => setPrimaryColor(e.target.value)}
                                        placeholder="#1e40af"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Secondary Color</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={secondaryColor}
                                        onChange={(e) => setSecondaryColor(e.target.value)}
                                        placeholder="#3b82f6"
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Accent Color</label>
                                <div className="color-input-wrapper">
                                    <input
                                        type="color"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        value={accentColor}
                                        onChange={(e) => setAccentColor(e.target.value)}
                                        placeholder="#60a5fa"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Font Selection */}
                        <div className="form-group">
                            <label>Brand Font</label>
                            <select
                                value={fontFamily}
                                onChange={(e) => setFontFamily(e.target.value)}
                                className="font-select"
                            >
                                {FONT_OPTIONS.map(font => (
                                    <option key={font.value} value={font.value}>
                                        {font.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Logo URL */}
                        <div className="form-group">
                            <label>Logo URL (optional)</label>
                            <input
                                type="url"
                                value={logoUrl}
                                onChange={(e) => setLogoUrl(e.target.value)}
                                placeholder="https://example.com/logo.png"
                            />
                            <span className="helper-text">Provide a URL to your brand logo</span>
                        </div>
                        
                        {/* Preview */}
                        <div className="brand-kit-preview">
                            <div className="preview-label">Preview</div>
                            <div 
                                className="preview-card"
                                style={{ 
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                    fontFamily: `'${fontFamily}', sans-serif`
                                }}
                            >
                                <div className="preview-header" style={{ color: accentColor }}>
                                    {logoUrl ? (
                                        <img src={logoUrl} alt="Logo" className="preview-logo" />
                                    ) : (
                                        <span className="preview-logo-placeholder">{name || 'Brand'}</span>
                                    )}
                                </div>
                                <div className="preview-content">
                                    <h3 style={{ color: '#fff' }}>Welcome to {name || 'Your Brand'}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        This is how your brand colors and font will look.
                                    </p>
                                    <button style={{ background: accentColor, color: primaryColor }}>
                                        Get Started
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="publish-modal-footer" style={{ justifyContent: 'space-between' }}>
                    {currentBrandKit && onDelete ? (
                        <button className="delete-btn" onClick={handleDelete}>
                            Delete
                        </button>
                    ) : (
                        <div></div>
                    )}
                    <button 
                        className="next-btn" 
                        onClick={handleSave}
                        disabled={!name.trim()}
                        style={{ 
                            background: name.trim() ? '#fff' : 'rgba(255,255,255,0.1)',
                            color: name.trim() ? '#000' : 'var(--text-secondary)'
                        }}
                    >
                        <CheckIcon /> Save Brand Kit
                    </button>
                </div>
            </div>
        </div>
    );
}
