/**
 * PublishModal - Handles publishing flow with SEO settings
 */

import React, { useState, useEffect } from 'react';
import type { Artifact, SEOSettings, FormSettings } from '../types';
import { publishPage, isSupabaseConfigured, downloadWithSEO } from '../lib/supabase';
import { XIcon, CheckIcon } from './Icons';
import { COPY_FEEDBACK_DURATION } from '../constants';

interface PublishModalProps {
    isOpen: boolean;
    onClose: () => void;
    artifact: Artifact;
    prompt: string;
    onPublished: (publishInfo: { url: string; shortId: string }) => void;
    userId?: string;
}

type TabType = 'seo' | 'forms' | 'domain' | 'publish';

export default function PublishModal({ isOpen, onClose, artifact, prompt, onPublished, userId }: PublishModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('seo');
    const [isPublishing, setIsPublishing] = useState(false);
    const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    
    // SEO Settings
    const [seo, setSeo] = useState<SEOSettings>({
        title: artifact.seo?.title || prompt.slice(0, 60),
        description: artifact.seo?.description || `${prompt} - Created with Flashed`,
        ogImage: artifact.seo?.ogImage || '',
    });
    
    // Form Settings
    const [formSettings, setFormSettings] = useState<FormSettings>({
        enabled: artifact.formSettings?.enabled || false,
        provider: artifact.formSettings?.provider || 'webhook',
        webhookUrl: artifact.formSettings?.webhookUrl || '',
        formspreeId: artifact.formSettings?.formspreeId || '',
    });
    
    // Custom Domain
    const [customDomain, setCustomDomain] = useState('');
    
    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setPublishedUrl(artifact.publishInfo?.url || null);
            setError(null);
            setCopied(false);
            setSeo({
                title: artifact.seo?.title || prompt.slice(0, 60),
                description: artifact.seo?.description || `${prompt} - Created with Flashed`,
                ogImage: artifact.seo?.ogImage || '',
            });
        }
    }, [isOpen, artifact, prompt]);
    
    const handlePublish = async () => {
        setIsPublishing(true);
        setError(null);

        const result = await publishPage(
            artifact,
            seo,
            formSettings.enabled ? formSettings : undefined,
            userId
        );

        if ('error' in result) {
            setError(result.error);
            setIsPublishing(false);
            return;
        }
        
        setPublishedUrl(result.url);
        onPublished(result);
        setIsPublishing(false);
        setActiveTab('publish');
    };
    
    const handleDownload = () => {
        downloadWithSEO(artifact.html, seo, `${seo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`);
    };
    
    const copyToClipboard = async () => {
        if (publishedUrl) {
            await navigator.clipboard.writeText(publishedUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
        }
    };

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isPublishing) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isPublishing, onClose]);

    if (!isOpen) return null;
    
    const supabaseConfigured = isSupabaseConfigured();
    
    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div className="publish-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="publish-title">
                <div className="publish-modal-header">
                    <h2 id="publish-title">Publish Page</h2>
                    <button className="close-button" onClick={onClose} aria-label="Close publish dialog">
                        <XIcon />
                    </button>
                </div>
                
                <div className="publish-tabs">
                    <button 
                        className={`publish-tab ${activeTab === 'seo' ? 'active' : ''}`}
                        onClick={() => setActiveTab('seo')}
                    >
                        SEO
                    </button>
                    <button 
                        className={`publish-tab ${activeTab === 'forms' ? 'active' : ''}`}
                        onClick={() => setActiveTab('forms')}
                    >
                        Forms
                    </button>
                    <button 
                        className={`publish-tab ${activeTab === 'domain' ? 'active' : ''}`}
                        onClick={() => setActiveTab('domain')}
                    >
                        Domain
                    </button>
                    <button 
                        className={`publish-tab ${activeTab === 'publish' ? 'active' : ''}`}
                        onClick={() => setActiveTab('publish')}
                    >
                        Publish
                    </button>
                </div>
                
                <div className="publish-modal-body">
                    {activeTab === 'seo' && (
                        <div className="seo-form">
                            <div className="form-group">
                                <label>Page Title</label>
                                <input
                                    type="text"
                                    value={seo.title}
                                    onChange={e => setSeo(s => ({ ...s, title: e.target.value }))}
                                    placeholder="My Awesome Landing Page"
                                    maxLength={60}
                                />
                                <span className="char-count">{seo.title.length}/60</span>
                            </div>
                            
                            <div className="form-group">
                                <label>Meta Description</label>
                                <textarea
                                    value={seo.description}
                                    onChange={e => setSeo(s => ({ ...s, description: e.target.value }))}
                                    placeholder="A brief description of your page for search engines..."
                                    maxLength={160}
                                    rows={3}
                                />
                                <span className="char-count">{seo.description.length}/160</span>
                            </div>
                            
                            <div className="form-group">
                                <label>OG Image URL (optional)</label>
                                <input
                                    type="url"
                                    value={seo.ogImage}
                                    onChange={e => setSeo(s => ({ ...s, ogImage: e.target.value }))}
                                    placeholder="https://example.com/og-image.jpg"
                                />
                                <span className="helper-text">Image shown when shared on social media (1200x630px recommended)</span>
                            </div>
                            
                            {/* SEO Preview */}
                            <div className="seo-preview">
                                <div className="seo-preview-title">Search Preview</div>
                                <div className="google-preview">
                                    <div className="google-title">{seo.title || 'Page Title'}</div>
                                    <div className="google-url">flashed.app/p/abc123</div>
                                    <div className="google-desc">{seo.description || 'Page description will appear here...'}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'forms' && (
                        <div className="forms-settings">
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formSettings.enabled}
                                        onChange={e => setFormSettings(s => ({ ...s, enabled: e.target.checked }))}
                                    />
                                    <span>Enable form handling</span>
                                </label>
                                <span className="helper-text">Make contact forms on your page actually work</span>
                            </div>
                            
                            {formSettings.enabled && (
                                <>
                                    <div className="form-group">
                                        <label>Form Handler</label>
                                        <div className="radio-group">
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="provider"
                                                    value="webhook"
                                                    checked={formSettings.provider === 'webhook'}
                                                    onChange={() => setFormSettings(s => ({ ...s, provider: 'webhook' }))}
                                                />
                                                <span>Webhook (n8n, Zapier, etc.)</span>
                                            </label>
                                            <label className="radio-label">
                                                <input
                                                    type="radio"
                                                    name="provider"
                                                    value="formspree"
                                                    checked={formSettings.provider === 'formspree'}
                                                    onChange={() => setFormSettings(s => ({ ...s, provider: 'formspree' }))}
                                                />
                                                <span>Formspree</span>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {formSettings.provider === 'webhook' && (
                                        <div className="form-group">
                                            <label>Webhook URL</label>
                                            <input
                                                type="url"
                                                value={formSettings.webhookUrl}
                                                onChange={e => setFormSettings(s => ({ ...s, webhookUrl: e.target.value }))}
                                                placeholder="https://hooks.zapier.com/... or n8n webhook URL"
                                            />
                                            <span className="helper-text">Form submissions will be POSTed to this URL as JSON</span>
                                        </div>
                                    )}
                                    
                                    {formSettings.provider === 'formspree' && (
                                        <div className="form-group">
                                            <label>Formspree Form ID</label>
                                            <input
                                                type="text"
                                                value={formSettings.formspreeId}
                                                onChange={e => setFormSettings(s => ({ ...s, formspreeId: e.target.value }))}
                                                placeholder="xyzabcde"
                                            />
                                            <span className="helper-text">
                                                Get your form ID from <a href="https://formspree.io" target="_blank" rel="noopener noreferrer">formspree.io</a>
                                            </span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'domain' && (
                        <div className="domain-settings">
                            <div className="form-group">
                                <label>Custom Domain</label>
                                <input
                                    type="text"
                                    value={customDomain}
                                    onChange={e => setCustomDomain(e.target.value)}
                                    placeholder="www.example.com"
                                />
                                <span className="helper-text">
                                    Connect your client's domain to serve this page
                                </span>
                            </div>
                            
                            {customDomain && (
                                <div className="domain-instructions">
                                    <h4>Setup Instructions</h4>
                                    <p>Add these DNS records to your domain registrar:</p>
                                    
                                    <div className="dns-record">
                                        <div className="dns-type">CNAME</div>
                                        <div className="dns-details">
                                            <div><strong>Name:</strong> {customDomain.startsWith('www.') ? 'www' : '@'}</div>
                                            <div><strong>Value:</strong> cname.flashed.app</div>
                                        </div>
                                    </div>
                                    
                                    <div className="dns-note">
                                        <strong>Note:</strong> DNS changes can take up to 48 hours to propagate. 
                                        SSL certificates are automatically provisioned once the domain is verified.
                                    </div>
                                    
                                    <div className="premium-badge">
                                        <span>Premium Feature</span>
                                        <p>Custom domains require a paid plan. The page will be published to the default URL until upgraded.</p>
                                    </div>
                                </div>
                            )}
                            
                            {!customDomain && (
                                <div className="domain-benefits">
                                    <h4>Why use a custom domain?</h4>
                                    <ul>
                                        <li>Professional appearance for your client</li>
                                        <li>Better brand recognition</li>
                                        <li>SEO benefits from a dedicated domain</li>
                                        <li>Full control over the URL structure</li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'publish' && (
                        <div className="publish-actions">
                            {!supabaseConfigured && (
                                <div className="warning-box">
                                    <strong>Cloud publishing not configured</strong>
                                    <p>Add Supabase credentials to enable one-click publishing. For now, you can download the HTML file with SEO settings applied.</p>
                                </div>
                            )}
                            
                            {error && (
                                <div className="error-box">
                                    {error}
                                </div>
                            )}
                            
                            {publishedUrl ? (
                                <div className="published-success">
                                    <div className="success-icon">
                                        <CheckIcon />
                                    </div>
                                    <h3>Page Published!</h3>
                                    <p>Your page is now live at:</p>
                                    <div className="published-url-box">
                                        <input type="text" value={publishedUrl} readOnly />
                                        <button onClick={copyToClipboard} className="copy-btn">
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="published-actions">
                                        <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="view-btn">
                                            View Live Page
                                        </a>
                                        <button onClick={handlePublish} className="republish-btn">
                                            Republish Changes
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="publish-options">
                                    {supabaseConfigured && (
                                        <button 
                                            className="publish-btn primary"
                                            onClick={handlePublish}
                                            disabled={isPublishing}
                                        >
                                            {isPublishing ? 'Publishing...' : 'Publish to Web'}
                                        </button>
                                    )}
                                    
                                    <button 
                                        className="publish-btn secondary"
                                        onClick={handleDownload}
                                    >
                                        Download HTML (with SEO)
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                
                {activeTab !== 'publish' && (
                    <div className="publish-modal-footer">
                        <button className="next-btn" onClick={() => {
                            if (activeTab === 'seo') setActiveTab('forms');
                            else if (activeTab === 'forms') setActiveTab('domain');
                            else if (activeTab === 'domain') setActiveTab('publish');
                        }}>
                            {activeTab === 'domain' ? 'Continue to Publish' : 
                             activeTab === 'forms' ? 'Next: Custom Domain' : 'Next: Form Settings'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
