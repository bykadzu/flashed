/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ComponentExtractor - Break down a full HTML page into individual reusable components
 */

import React, { useState, useMemo } from 'react';
import { nanoid } from 'nanoid';
import { ExtractedComponent } from '../types';
import { XIcon, DownloadIcon, CodeIcon, LayersIcon, CheckIcon } from './Icons';

interface ComponentExtractorProps {
    isOpen: boolean;
    onClose: () => void;
    html: string;
    onSaveComponent: (component: ExtractedComponent) => void;
}

type ComponentType = ExtractedComponent['type'];

const CLASS_PATTERN_MAP: Record<string, ComponentType> = {
    hero: 'hero',
    features: 'features',
    feature: 'features',
    pricing: 'pricing',
    price: 'pricing',
    testimonial: 'testimonials',
    review: 'testimonials',
    cta: 'cta',
    'call-to-action': 'cta',
    gallery: 'gallery',
    portfolio: 'gallery',
    contact: 'form',
    form: 'form',
    about: 'other',
    footer: 'footer',
    header: 'header',
    nav: 'nav',
    navigation: 'nav',
};

function detectComponentType(element: Element): ComponentType {
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'header') return 'header';
    if (tagName === 'nav') return 'nav';
    if (tagName === 'footer') return 'footer';
    if (tagName === 'aside') return 'other';

    const classNames = (element.className || '').toLowerCase();
    const id = (element.id || '').toLowerCase();
    const combined = `${classNames} ${id}`;

    for (const [pattern, type] of Object.entries(CLASS_PATTERN_MAP)) {
        if (combined.includes(pattern)) {
            return type;
        }
    }

    // Check inner content for clues
    const innerText = element.textContent?.toLowerCase() || '';
    if (element.querySelector('form')) return 'form';
    if (innerText.includes('pricing') || innerText.includes('per month')) return 'pricing';
    if (innerText.includes('testimonial') || innerText.includes('what our')) return 'testimonials';

    return 'other';
}

function generateComponentName(type: ComponentType, index: number): string {
    const typeLabels: Record<ComponentType, string> = {
        header: 'Header',
        hero: 'Hero Section',
        features: 'Features Section',
        pricing: 'Pricing Section',
        testimonials: 'Testimonials',
        footer: 'Footer',
        cta: 'Call to Action',
        nav: 'Navigation',
        form: 'Form Section',
        gallery: 'Gallery',
        other: 'Section',
    };
    return `${typeLabels[type]} ${index + 1}`;
}

function generateDescription(type: ComponentType, element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const childCount = element.children.length;
    const textLength = (element.textContent || '').trim().length;
    const hasImages = element.querySelectorAll('img').length > 0;
    const hasForms = element.querySelectorAll('form').length > 0;
    const hasLinks = element.querySelectorAll('a').length;

    const parts: string[] = [];
    parts.push(`<${tagName}> element`);
    if (childCount > 0) parts.push(`${childCount} child elements`);
    if (hasImages) parts.push(`${element.querySelectorAll('img').length} images`);
    if (hasForms) parts.push('contains form');
    if (hasLinks > 0) parts.push(`${hasLinks} links`);
    if (textLength > 0) parts.push(`${textLength} chars of text`);

    return parts.join(' | ');
}

function extractCSSForElement(allCSS: string, elementHTML: string): string {
    if (!allCSS.trim()) return '';

    const rules: string[] = [];
    // Parse CSS rules using a simple regex approach
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let match: RegExpExecArray | null;

    while ((match = ruleRegex.exec(allCSS)) !== null) {
        const selector = match[1].trim();
        const body = match[2].trim();

        if (!selector || !body) continue;
        // Skip @-rules like @media, @keyframes selectors
        if (selector.startsWith('@')) continue;

        // Check if any part of the selector matches content in the element HTML
        const selectorParts = selector.split(',').map(s => s.trim());
        for (const part of selectorParts) {
            // Extract class names and IDs from the selector
            const classMatches = part.match(/\.([a-zA-Z_-][\w-]*)/g);
            const idMatches = part.match(/#([a-zA-Z_-][\w-]*)/g);
            const tagMatches = part.match(/^([a-z][a-z0-9]*)/i);

            let isRelevant = false;

            if (classMatches) {
                for (const cls of classMatches) {
                    const className = cls.substring(1); // remove the dot
                    if (elementHTML.includes(className)) {
                        isRelevant = true;
                        break;
                    }
                }
            }

            if (!isRelevant && idMatches) {
                for (const idMatch of idMatches) {
                    const idName = idMatch.substring(1); // remove the hash
                    if (elementHTML.includes(idName)) {
                        isRelevant = true;
                        break;
                    }
                }
            }

            if (!isRelevant && tagMatches) {
                const tag = tagMatches[1].toLowerCase();
                // Only match specific tag selectors if the tag exists in the HTML
                const tagRegex = new RegExp(`<${tag}[\\s>]`, 'i');
                if (tagRegex.test(elementHTML)) {
                    isRelevant = true;
                }
            }

            if (isRelevant) {
                rules.push(`${selector} {\n  ${body}\n}`);
                break;
            }
        }
    }

    return rules.join('\n\n');
}

function extractComponents(html: string): ExtractedComponent[] {
    if (!html.trim()) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const components: ExtractedComponent[] = [];

    // Extract all CSS from style tags
    const styleTags = doc.querySelectorAll('style');
    let allCSS = '';
    styleTags.forEach(tag => {
        allCSS += tag.textContent || '';
        allCSS += '\n';
    });

    // Semantic elements to look for
    const selectors = [
        'header',
        'nav',
        'main > section',
        'main > div',
        'body > section',
        'body > div > section',
        'body > div > div',
        'section',
        'footer',
        'main',
        'aside',
    ];

    const processedElements = new Set<Element>();
    const typeCounters = new Map<ComponentType, number>();

    for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(element => {
            // Skip if already processed or is a child of a processed element
            if (processedElements.has(element)) return;

            // Skip if this element is a child of another already-processed element
            let isChild = false;
            for (const processed of processedElements) {
                if (processed.contains(element) && processed !== element) {
                    isChild = true;
                    break;
                }
            }
            if (isChild) return;

            // Skip elements with very little content
            const textContent = (element.textContent || '').trim();
            if (textContent.length < 10 && element.children.length === 0) return;

            // Skip the main element itself if it has section children
            if (element.tagName.toLowerCase() === 'main' && element.querySelectorAll('section').length > 0) return;

            // Skip wrapper divs that just contain other sections
            if (element.tagName.toLowerCase() === 'div') {
                const directSections = element.querySelectorAll(':scope > section, :scope > header, :scope > footer, :scope > nav');
                if (directSections.length > 0) return;
            }

            const type = detectComponentType(element);
            const count = typeCounters.get(type) || 0;
            typeCounters.set(type, count + 1);

            const elementHTML = element.outerHTML;
            const css = extractCSSForElement(allCSS, elementHTML);

            components.push({
                id: nanoid(),
                name: generateComponentName(type, count),
                html: elementHTML,
                css,
                type,
                description: generateDescription(type, element),
            });

            processedElements.add(element);
        });
    }

    // Also check for common class pattern divs that might not be semantic elements
    const body = doc.body;
    if (body) {
        const allElements = body.querySelectorAll('div[class], section[class]');
        allElements.forEach(element => {
            if (processedElements.has(element)) return;

            // Skip if child of processed
            let isChild = false;
            for (const processed of processedElements) {
                if (processed.contains(element) && processed !== element) {
                    isChild = true;
                    break;
                }
            }
            if (isChild) return;

            const classNames = (element.className || '').toLowerCase();
            const matchedType = Object.entries(CLASS_PATTERN_MAP).find(([pattern]) =>
                classNames.includes(pattern)
            );

            if (matchedType) {
                const type = matchedType[1];
                const count = typeCounters.get(type) || 0;
                typeCounters.set(type, count + 1);

                const elementHTML = element.outerHTML;
                const css = extractCSSForElement(allCSS, elementHTML);

                components.push({
                    id: nanoid(),
                    name: generateComponentName(type, count),
                    html: elementHTML,
                    css,
                    type,
                    description: generateDescription(type, element),
                });

                processedElements.add(element);
            }
        });
    }

    return components;
}

export default function ComponentExtractor({ isOpen, onClose, html, onSaveComponent }: ComponentExtractorProps) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [renamedComponents, setRenamedComponents] = useState<Map<string, string>>(new Map());

    const components = useMemo(() => {
        if (!html) return [];
        return extractComponents(html);
    }, [html]);

    const getComponentName = (component: ExtractedComponent): string => {
        return renamedComponents.get(component.id) || component.name;
    };

    const handleCopyHTML = async (component: ExtractedComponent) => {
        const fullHTML = component.css
            ? `<style>\n${component.css}\n</style>\n${component.html}`
            : component.html;
        await navigator.clipboard.writeText(fullHTML);
        setCopiedId(component.id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleSave = (component: ExtractedComponent) => {
        const name = getComponentName(component);
        onSaveComponent({ ...component, name });
        setSavedIds(prev => new Set(prev).add(component.id));
    };

    const handleStartRename = (component: ExtractedComponent) => {
        setEditingId(component.id);
        setEditingName(getComponentName(component));
    };

    const handleFinishRename = () => {
        if (editingId && editingName.trim()) {
            setRenamedComponents(prev => new Map(prev).set(editingId, editingName.trim()));
        }
        setEditingId(null);
        setEditingName('');
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFinishRename();
        } else if (e.key === 'Escape') {
            setEditingId(null);
            setEditingName('');
        }
    };

    const typeColors: Record<ComponentType, string> = {
        header: '#3b82f6',
        hero: '#8b5cf6',
        features: '#10b981',
        pricing: '#f59e0b',
        testimonials: '#ec4899',
        footer: '#6b7280',
        cta: '#ef4444',
        nav: '#06b6d4',
        form: '#f97316',
        gallery: '#14b8a6',
        other: '#64748b',
    };

    if (!isOpen) return null;

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div
                className="publish-modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '900px', maxHeight: '85vh' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="extractor-title"
            >
                {/* Header */}
                <div className="publish-modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LayersIcon />
                        <div>
                            <h2 id="extractor-title" style={{ margin: 0 }}>Component Extractor</h2>
                            <p style={{
                                margin: '4px 0 0 0',
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                            }}>
                                {components.length} component{components.length !== 1 ? 's' : ''} found
                            </p>
                        </div>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close component extractor">
                        <XIcon />
                    </button>
                </div>

                {/* Content */}
                <div className="publish-modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(85vh - 80px)', padding: '16px 24px 24px' }}>
                    {components.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px',
                            color: 'var(--text-secondary)',
                        }}>
                            <LayersIcon />
                            <h3 style={{ marginTop: '12px', color: 'var(--text-primary)' }}>No components found</h3>
                            <p>The HTML does not contain recognizable semantic sections to extract.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                            gap: '16px',
                        }}>
                            {components.map(component => (
                                <div
                                    key={component.id}
                                    style={{
                                        border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: 'var(--card-bg, rgba(255,255,255,0.03))',
                                        transition: 'border-color 0.2s',
                                    }}
                                >
                                    {/* Preview iframe */}
                                    <div style={{
                                        height: '180px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        background: '#fff',
                                        borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                    }}>
                                        <iframe
                                            srcDoc={`<!DOCTYPE html><html><head><style>${component.css || ''}</style></head><body style="margin:0;overflow:hidden;">${component.html}</body></html>`}
                                            title={getComponentName(component)}
                                            sandbox="allow-same-origin"
                                            style={{
                                                width: '1280px',
                                                height: '720px',
                                                border: 'none',
                                                transform: 'scale(0.3)',
                                                transformOrigin: 'top left',
                                                pointerEvents: 'none',
                                            }}
                                        />
                                    </div>

                                    {/* Component info */}
                                    <div style={{ padding: '12px 16px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px',
                                        }}>
                                            {editingId === component.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={e => setEditingName(e.target.value)}
                                                    onBlur={handleFinishRename}
                                                    onKeyDown={handleRenameKeyDown}
                                                    autoFocus
                                                    style={{
                                                        flex: 1,
                                                        background: 'rgba(255,255,255,0.08)',
                                                        border: '1px solid var(--border-color, rgba(255,255,255,0.2))',
                                                        borderRadius: '6px',
                                                        padding: '4px 8px',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600,
                                                        outline: 'none',
                                                    }}
                                                />
                                            ) : (
                                                <h4
                                                    onClick={() => handleStartRename(component)}
                                                    title="Click to rename"
                                                    style={{
                                                        margin: 0,
                                                        fontSize: '0.9rem',
                                                        fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                        cursor: 'pointer',
                                                    }}
                                                >
                                                    {getComponentName(component)}
                                                </h4>
                                            )}
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: `${typeColors[component.type]}22`,
                                                color: typeColors[component.type],
                                                whiteSpace: 'nowrap',
                                                marginLeft: '8px',
                                            }}>
                                                {component.type}
                                            </span>
                                        </div>

                                        <p style={{
                                            margin: '0 0 12px 0',
                                            fontSize: '0.78rem',
                                            color: 'var(--text-secondary)',
                                            lineHeight: 1.4,
                                        }}>
                                            {component.description}
                                        </p>

                                        {/* Actions */}
                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                        }}>
                                            <button
                                                onClick={() => handleCopyHTML(component)}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    padding: '8px 12px',
                                                    background: 'rgba(255,255,255,0.06)',
                                                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                                    borderRadius: '8px',
                                                    color: copiedId === component.id ? '#10b981' : 'var(--text-primary)',
                                                    fontSize: '0.8rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {copiedId === component.id ? (
                                                    <>
                                                        <CheckIcon /> Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <CodeIcon /> Copy HTML
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleSave(component)}
                                                disabled={savedIds.has(component.id)}
                                                style={{
                                                    flex: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    padding: '8px 12px',
                                                    background: savedIds.has(component.id)
                                                        ? 'rgba(16, 185, 129, 0.15)'
                                                        : 'var(--accent-color, #6366f1)',
                                                    border: 'none',
                                                    borderRadius: '8px',
                                                    color: savedIds.has(component.id)
                                                        ? '#10b981'
                                                        : '#fff',
                                                    fontSize: '0.8rem',
                                                    cursor: savedIds.has(component.id) ? 'default' : 'pointer',
                                                    opacity: savedIds.has(component.id) ? 0.8 : 1,
                                                    transition: 'all 0.2s',
                                                }}
                                            >
                                                {savedIds.has(component.id) ? (
                                                    <>
                                                        <CheckIcon /> Saved
                                                    </>
                                                ) : (
                                                    <>
                                                        <DownloadIcon /> Save to Library
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
