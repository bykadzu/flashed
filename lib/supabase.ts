/**
 * Supabase client and publishing utilities
 */

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import type { Artifact, SEOSettings, FormSettings, PublishedPage } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Construct Edge Functions base URL from Supabase URL
// e.g., https://abc123.supabase.co -> https://abc123.supabase.co/functions/v1
const edgeFunctionsUrl = supabaseUrl ? `${supabaseUrl}/functions/v1` : '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
    return !!supabase;
};

// Generate a short ID for URLs
export const generateShortId = () => nanoid(8);

// Inject SEO meta tags and form handling into HTML
export const prepareHtmlForPublishing = (
    html: string, 
    seo: SEOSettings, 
    formSettings?: FormSettings,
    shortId?: string
): string => {
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Ensure we have a head element
    let head = doc.head;
    if (!head) {
        head = doc.createElement('head');
        doc.documentElement.insertBefore(head, doc.body);
    }
    
    // Remove existing meta tags we'll replace
    const existingMetas = head.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name="twitter:"]');
    existingMetas.forEach(m => m.remove());
    
    // Set title
    let titleEl = head.querySelector('title');
    if (!titleEl) {
        titleEl = doc.createElement('title');
        head.appendChild(titleEl);
    }
    titleEl.textContent = seo.title;
    
    // Add meta description
    const descMeta = doc.createElement('meta');
    descMeta.setAttribute('name', 'description');
    descMeta.setAttribute('content', seo.description);
    head.appendChild(descMeta);
    
    // Add Open Graph tags
    const ogTags = [
        { property: 'og:title', content: seo.title },
        { property: 'og:description', content: seo.description },
        { property: 'og:type', content: 'website' },
    ];
    
    if (seo.ogImage) {
        ogTags.push({ property: 'og:image', content: seo.ogImage });
    }
    
    ogTags.forEach(tag => {
        const meta = doc.createElement('meta');
        meta.setAttribute('property', tag.property);
        meta.setAttribute('content', tag.content);
        head.appendChild(meta);
    });
    
    // Add Twitter Card tags
    const twitterMeta = doc.createElement('meta');
    twitterMeta.setAttribute('name', 'twitter:card');
    twitterMeta.setAttribute('content', 'summary_large_image');
    head.appendChild(twitterMeta);
    
    // Add viewport meta if not present
    if (!head.querySelector('meta[name="viewport"]')) {
        const viewport = doc.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1');
        head.appendChild(viewport);
    }
    
    // Add favicon if provided
    if (seo.favicon) {
        let link = head.querySelector('link[rel="icon"]') as HTMLLinkElement;
        if (!link) {
            link = doc.createElement('link');
            link.rel = 'icon';
            head.appendChild(link);
        }
        link.href = seo.favicon;
    }
    
    // Inject form handling script if forms are enabled
    if (formSettings?.enabled) {
        const forms = doc.querySelectorAll('form');
        forms.forEach((form, index) => {
            // Add unique ID to form
            form.id = form.id || `flashed-form-${index}`;
            
            // Set form action based on provider
            if (formSettings.provider === 'formspree' && formSettings.formspreeId) {
                form.action = `https://formspree.io/f/${formSettings.formspreeId}`;
                form.method = 'POST';
            } else if (formSettings.provider === 'webhook' && formSettings.webhookUrl) {
                form.setAttribute('data-webhook', formSettings.webhookUrl);
            }
        });
        
        // Inject form handling script for webhook mode
        if (formSettings.provider === 'webhook' && formSettings.webhookUrl) {
            const script = doc.createElement('script');
            script.textContent = `
                document.querySelectorAll('form[data-webhook]').forEach(form => {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const formData = new FormData(form);
                        const data = Object.fromEntries(formData.entries());
                        const webhook = form.getAttribute('data-webhook');
                        
                        try {
                            const btn = form.querySelector('button[type="submit"], input[type="submit"]');
                            if (btn) btn.disabled = true;
                            
                            await fetch(webhook, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...data, _pageId: '${shortId || ''}', _timestamp: Date.now() })
                            });
                            
                            // Show success message
                            const msg = document.createElement('div');
                            msg.style.cssText = 'padding:16px;background:#10b981;color:white;border-radius:8px;margin-top:16px;text-align:center;';
                            msg.textContent = 'Thank you! Your message has been sent.';
                            form.appendChild(msg);
                            form.reset();
                        } catch (err) {
                            console.error('Form submission error:', err);
                            alert('There was an error submitting the form. Please try again.');
                        } finally {
                            const btn = form.querySelector('button[type="submit"], input[type="submit"]');
                            if (btn) btn.disabled = false;
                        }
                    });
                });
            `;
            doc.body.appendChild(script);
        }
    }
    
    // Add analytics tracking script (only if Supabase is configured)
    if (shortId && edgeFunctionsUrl) {
        const analyticsScript = doc.createElement('script');
        analyticsScript.textContent = `
            (function() {
                try {
                    fetch('${edgeFunctionsUrl}/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pageId: '${shortId}',
                            referrer: document.referrer,
                            userAgent: navigator.userAgent
                        })
                    }).catch(() => {});
                } catch(e) {}
            })();
        `;
        doc.body.appendChild(analyticsScript);
    }
    
    return '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
};

// Publish a page to Supabase
export const publishPage = async (
    artifact: Artifact,
    seo: SEOSettings,
    formSettings?: FormSettings,
    userId?: string,
    batchId?: string
): Promise<{ url: string; shortId: string } | { error: string }> => {
    if (!supabase) {
        // Fallback: Generate a data URL for download if Supabase isn't configured
        return { error: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.' };
    }
    
    try {
        const shortId = artifact.publishInfo?.shortId || generateShortId();
        const preparedHtml = prepareHtmlForPublishing(artifact.html, seo, formSettings, shortId);
        
        // Check if this page already exists (update vs insert)
        const { data: existing } = await supabase
            .from('published_pages')
            .select('id, version')
            .eq('short_id', shortId)
            .single();
        
        const pageData: Record<string, any> = {
            short_id: shortId,
            html: preparedHtml,
            seo_title: seo.title,
            seo_description: seo.description,
            og_image: seo.ogImage,
            form_settings: formSettings,
            updated_at: new Date().toISOString(),
            version: existing ? existing.version + 1 : 1
        };

        // Associate with user if logged in
        if (userId) {
            pageData.user_id = userId;
        }

        // Associate with batch if provided
        if (batchId) {
            pageData.batch_id = batchId;
        }
        
        let result;
        if (existing) {
            // Update existing page
            result = await supabase
                .from('published_pages')
                .update(pageData)
                .eq('id', existing.id)
                .select()
                .single();
        } else {
            // Insert new page
            result = await supabase
                .from('published_pages')
                .insert({
                    ...pageData,
                    created_at: new Date().toISOString(),
                    views: 0
                })
                .select()
                .single();
        }
        
        if (result.error) {
            throw result.error;
        }
        
        // Construct the public URL
        const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
        const url = `${baseUrl}/p/${shortId}`;
        
        return { url, shortId };
    } catch (error: any) {
        console.error('Publish error:', error);
        return { error: error.message || 'Failed to publish page' };
    }
};

// Get a published page by short ID
export const getPublishedPage = async (shortId: string): Promise<PublishedPage | null> => {
    if (!supabase) return null;
    
    const { data, error } = await supabase
        .from('published_pages')
        .select('*')
        .eq('short_id', shortId)
        .single();
    
    if (error || !data) return null;
    
    // Increment view count
    await supabase
        .from('published_pages')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', data.id);
    
    return data;
};

// Generate preview URL (temporary, stored in memory/localStorage)
export const generatePreviewUrl = (html: string, seo: SEOSettings): string => {
    const preparedHtml = prepareHtmlForPublishing(html, seo);
    const blob = new Blob([preparedHtml], { type: 'text/html' });
    return URL.createObjectURL(blob);
};

// Download HTML with SEO
export const downloadWithSEO = (html: string, seo: SEOSettings, filename: string) => {
    const preparedHtml = prepareHtmlForPublishing(html, seo);
    const blob = new Blob([preparedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
