/**
 * ShareModal - Generate shareable preview links for client review
 */

import React, { useState, useEffect } from 'react';
import type { Artifact, SEOSettings } from '../types';
import { prepareHtmlForPublishing, supabase, generateShortId } from '../lib/supabase';
import { XIcon, CheckIcon, LinkIcon } from './Icons';
import { COPY_FEEDBACK_DURATION } from '../constants';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    artifact: Artifact;
    prompt: string;
}

export default function ShareModal({ isOpen, onClose, artifact, prompt }: ShareModalProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [_expiresIn, _setExpiresIn] = useState<string>('24h');
    
    useEffect(() => {
        if (isOpen) {
            setPreviewUrl(null);
            setError(null);
            setCopied(false);
        }
    }, [isOpen]);
    
    const generatePreviewLink = async () => {
        setIsGenerating(true);
        setError(null);
        
        try {
            // Prepare HTML with basic SEO
            const seo: SEOSettings = {
                title: prompt.slice(0, 60),
                description: `Preview: ${prompt}`,
            };
            
            const preparedHtml = prepareHtmlForPublishing(artifact.html, seo);
            
            if (supabase) {
                // Upload to Supabase Storage as a preview
                const previewId = `preview_${generateShortId()}`;
                const fileName = `${previewId}.html`;
                
                const { error: uploadError } = await supabase.storage
                    .from('previews')
                    .upload(fileName, preparedHtml, {
                        contentType: 'text/html',
                        cacheControl: '3600',
                        upsert: true
                    });
                
                if (uploadError) {
                    // If storage bucket doesn't exist, fall back to blob URL
                    console.warn('Storage upload failed, using fallback:', uploadError);
                    throw new Error('Storage not configured');
                }
                
                // Get public URL
                const { data: urlData } = supabase.storage
                    .from('previews')
                    .getPublicUrl(fileName);
                
                setPreviewUrl(urlData.publicUrl);
            } else {
                // Fallback: Create a data URL and encode for sharing
                // This creates a URL that can be opened locally but not shared across devices
                const blob = new Blob([preparedHtml], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                setPreviewUrl(blobUrl);
                setError('Note: This preview link only works on your device. Configure Supabase for shareable links.');
            }
        } catch {
            // Final fallback: blob URL
            const seo: SEOSettings = {
                title: prompt.slice(0, 60),
                description: `Preview: ${prompt}`,
            };
            const preparedHtml = prepareHtmlForPublishing(artifact.html, seo);
            const blob = new Blob([preparedHtml], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            setPreviewUrl(blobUrl);
            setError('Preview link only works on your device. Configure Supabase storage for shareable links.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const copyToClipboard = async () => {
        if (previewUrl) {
            await navigator.clipboard.writeText(previewUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
        }
    };
    
    const openPreview = () => {
        if (previewUrl) {
            window.open(previewUrl, '_blank');
        }
    };
    
    const downloadAsHtml = () => {
        const seo: SEOSettings = {
            title: prompt.slice(0, 60),
            description: `${prompt}`,
        };
        const preparedHtml = prepareHtmlForPublishing(artifact.html, seo);
        const blob = new Blob([preparedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${prompt.slice(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}-preview.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isGenerating) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isGenerating, onClose]);

    if (!isOpen) return null;
    
    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }} role="dialog" aria-modal="true" aria-labelledby="share-title">
                <div className="publish-modal-header">
                    <h2 id="share-title">Share Preview</h2>
                    <button className="close-button" onClick={onClose} aria-label="Close share dialog">
                        <XIcon />
                    </button>
                </div>
                
                <div className="publish-modal-body">
                    <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
                        Generate a preview link to share with your client for review before publishing.
                    </p>
                    
                    {!previewUrl ? (
                        <div className="publish-options">
                            <button 
                                className="publish-btn primary"
                                onClick={generatePreviewLink}
                                disabled={isGenerating}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <LinkIcon />
                                {isGenerating ? 'Generating...' : 'Generate Preview Link'}
                            </button>
                            
                            <button 
                                className="publish-btn secondary"
                                onClick={downloadAsHtml}
                            >
                                Download HTML for Manual Sharing
                            </button>
                            
                            <button 
                                className="publish-btn secondary"
                                onClick={async () => {
                                    const seo: SEOSettings = {
                                        title: prompt.slice(0, 60),
                                        description: `${prompt}`,
                                    };
                                    const preparedHtml = prepareHtmlForPublishing(artifact.html, seo);
                                    await navigator.clipboard.writeText(preparedHtml);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
                                }}
                            >
                                Copy Full HTML to Clipboard
                            </button>
                        </div>
                    ) : (
                        <div className="published-success">
                            <div className="success-icon">
                                <CheckIcon />
                            </div>
                            <h3>Preview Ready!</h3>
                            
                            {previewUrl && (
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Scan to preview on mobile:
                                    </p>
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(previewUrl)}`}
                                        alt="QR Code for preview link"
                                        style={{ borderRadius: '8px' }}
                                    />
                                </div>
                            )}
                            
                            <div className="published-url-box">
                                <input 
                                    type="text" 
                                    value={previewUrl} 
                                    readOnly 
                                    style={{ fontSize: '0.85rem' }}
                                />
                                <button onClick={copyToClipboard} className="copy-btn">
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                            
                            <div className="published-actions">
                                <button onClick={openPreview} className="view-btn">
                                    Open Preview
                                </button>
                                <button onClick={() => setPreviewUrl(null)} className="republish-btn">
                                    Generate New Link
                                </button>
                            </div>
                            
                            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    <strong style={{ color: 'var(--text-primary)' }}>Tip:</strong> Send this link to your client for feedback. 
                                    When they approve, use the Publish button to make it permanent.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
