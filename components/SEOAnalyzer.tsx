/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * SEOAnalyzer - Scans generated HTML and provides an SEO score with actionable suggestions
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SEOAnalysis, SEOIssue } from '../types';
import { XIcon, CheckIcon, ShieldIcon } from './Icons';

interface SEOAnalyzerProps {
    isOpen: boolean;
    onClose: () => void;
    html: string;
    onAutoFix: (fixedHtml: string) => void;
}

type IssueCategory = 'Meta Tags' | 'Content' | 'Images' | 'Structure' | 'Performance' | 'Accessibility';

const ISSUE_CATEGORIES: IssueCategory[] = [
    'Meta Tags',
    'Content',
    'Images',
    'Structure',
    'Performance',
    'Accessibility',
];

function analyzeHTML(html: string): SEOAnalysis {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const issues: SEOIssue[] = [];

    // --- Meta Tags ---

    const titleEl = doc.querySelector('title');
    const titleText = titleEl?.textContent?.trim() || '';

    if (!titleEl || !titleText) {
        issues.push({
            type: 'error',
            category: 'Meta Tags',
            message: 'Missing <title> tag. Search engines rely on the title to understand your page.',
            fix: 'add-title',
        });
    } else if (titleText.length < 30) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: `Title is too short (${titleText.length} chars). Aim for 30-60 characters.`,
        });
    } else if (titleText.length > 60) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: `Title is too long (${titleText.length} chars). Aim for 30-60 characters.`,
        });
    }

    const metaDesc = doc.querySelector('meta[name="description"]');
    const descContent = metaDesc?.getAttribute('content')?.trim() || '';

    if (!metaDesc || !descContent) {
        issues.push({
            type: 'error',
            category: 'Meta Tags',
            message: 'Missing meta description. This is shown in search result snippets.',
            fix: 'add-meta-description',
        });
    } else if (descContent.length < 120) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: `Meta description is too short (${descContent.length} chars). Aim for 120-160 characters.`,
        });
    } else if (descContent.length > 160) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: `Meta description is too long (${descContent.length} chars). Aim for 120-160 characters.`,
        });
    }

    const hasViewport = !!doc.querySelector('meta[name="viewport"]');
    if (!hasViewport) {
        issues.push({
            type: 'error',
            category: 'Meta Tags',
            message: 'Missing viewport meta tag. Page will not render correctly on mobile devices.',
            fix: 'add-viewport',
        });
    }

    const hasCharset = !!doc.querySelector('meta[charset]') ||
        !!doc.querySelector('meta[http-equiv="Content-Type"]');
    if (!hasCharset) {
        issues.push({
            type: 'warning',
            category: 'Meta Tags',
            message: 'Missing charset declaration. Specify UTF-8 to ensure correct character rendering.',
            fix: 'add-charset',
        });
    }

    const htmlEl = doc.querySelector('html');
    const hasLang = !!htmlEl?.getAttribute('lang');
    if (!hasLang) {
        issues.push({
            type: 'warning',
            category: 'Accessibility',
            message: 'Missing lang attribute on <html> tag. Screen readers need this to set pronunciation.',
            fix: 'add-lang',
        });
    }

    const hasOgTitle = !!doc.querySelector('meta[property="og:title"]');
    const hasOgDesc = !!doc.querySelector('meta[property="og:description"]');
    const hasOgImage = !!doc.querySelector('meta[property="og:image"]');
    const hasOgTags = hasOgTitle && hasOgDesc;

    // Twitter Card tags
    const hasTwitterCard = !!doc.querySelector('meta[name="twitter:card"]');
    const hasTwitterSite = !!doc.querySelector('meta[name="twitter:site"]');

    if (!hasOgTitle) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing Open Graph title tag. Social media shares will lack a custom title.',
            fix: 'add-og-title',
        });
    }
    if (!hasOgDesc) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing Open Graph description tag. Social media shares will lack a description.',
            fix: 'add-og-description',
        });
    }
    if (!hasOgImage) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing Open Graph image tag. Social media shares will not display a preview image.',
            fix: 'add-og-image',
        });
    }

    // Twitter Card checks
    if (!hasTwitterCard) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing Twitter Card meta tags. Twitter shares will not display a preview card.',
        });
    }
    if (!hasTwitterSite && hasTwitterCard) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing Twitter Site (@username) tag. Add twitter:site for better Twitter previews.',
        });
    }

    const hasCanonical = !!doc.querySelector('link[rel="canonical"]');
    if (!hasCanonical) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing canonical link. This helps prevent duplicate content issues in search engines.',
        });
    }

    // Favicon check
    const hasFavicon = !!doc.querySelector('link[rel="icon"]') ||
        !!doc.querySelector('link[rel="shortcut icon"]') ||
        !!doc.querySelector('link[rel="apple-touch-icon"]');
    if (!hasFavicon) {
        issues.push({
            type: 'info',
            category: 'Meta Tags',
            message: 'Missing favicon link. Add a favicon for browser tab branding.',
            fix: 'add-favicon',
        });
    }

    // --- Content ---

    const h1Elements = doc.querySelectorAll('h1');
    if (h1Elements.length === 0) {
        issues.push({
            type: 'error',
            category: 'Content',
            message: 'Missing <h1> heading. Every page should have exactly one H1.',
        });
    } else if (h1Elements.length > 1) {
        issues.push({
            type: 'warning',
            category: 'Content',
            message: `Multiple <h1> tags found (${h1Elements.length}). A page should have exactly one H1.`,
        });
    }

    // Heading hierarchy check
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingStructure: string[] = [];
    let prevLevel = 0;
    let hasHierarchyIssue = false;

    headings.forEach((heading) => {
        const level = parseInt(heading.tagName[1], 10);
        const text = heading.textContent?.trim() || '(empty)';
        headingStructure.push(`${heading.tagName}: ${text}`);

        if (prevLevel > 0 && level > prevLevel + 1) {
            hasHierarchyIssue = true;
        }
        prevLevel = level;
    });

    if (hasHierarchyIssue) {
        issues.push({
            type: 'warning',
            category: 'Structure',
            message: 'Heading hierarchy skips levels (e.g. H1 to H3). Use headings in sequential order.',
            fix: 'fix-heading-hierarchy',
        });
    }

    // Content length
    const bodyText = doc.body?.textContent?.trim() || '';
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
        issues.push({
            type: 'warning',
            category: 'Content',
            message: `Page has very little text content (${wordCount} words). Search engines prefer pages with substantial content.`,
        });
    } else if (wordCount < 300) {
        issues.push({
            type: 'info',
            category: 'Content',
            message: `Page has ${wordCount} words. Consider adding more content for better search ranking (300+ recommended).`,
        });
    }

    // --- Images ---

    const images = doc.querySelectorAll('img');
    const imageCount = images.length;
    let imagesWithAlt = 0;
    const imagesMissingAlt: Element[] = [];

    images.forEach((img) => {
        if (img.hasAttribute('alt')) {
            imagesWithAlt++;
        } else {
            imagesMissingAlt.push(img);
        }
    });

    if (imagesMissingAlt.length > 0) {
        issues.push({
            type: 'error',
            category: 'Images',
            message: `${imagesMissingAlt.length} image(s) missing alt attribute. Alt text is essential for accessibility and SEO.`,
            fix: 'add-alt-text',
        });
    }

    images.forEach((img) => {
        const alt = img.getAttribute('alt');
        if (alt && alt.length > 125) {
            issues.push({
                type: 'info',
                category: 'Images',
                message: `An image has overly long alt text (${alt.length} chars). Keep alt text concise (under 125 characters).`,
            });
        }
    });

    // --- Links ---

    const links = doc.querySelectorAll('a');
    const linkCount = links.length;

    links.forEach((link) => {
        const text = link.textContent?.trim() || '';
        const href = link.getAttribute('href') || '';

        if (text && /^(click here|here|read more|link|more)$/i.test(text)) {
            issues.push({
                type: 'warning',
                category: 'Accessibility',
                message: `Link with non-descriptive text "${text}". Use meaningful link text for accessibility and SEO.`,
            });
        }

        if (href.startsWith('#') && href.length > 1) {
            const targetId = href.slice(1);
            if (!doc.getElementById(targetId)) {
                issues.push({
                    type: 'warning',
                    category: 'Structure',
                    message: `Internal link "${href}" points to a non-existent element.`,
                });
            }
        }
    });

    // --- Performance ---

    const inlineStyles = doc.querySelectorAll('[style]');
    if (inlineStyles.length > 15) {
        issues.push({
            type: 'info',
            category: 'Performance',
            message: `Found ${inlineStyles.length} elements with inline styles. Consider consolidating into a <style> block.`,
        });
    }

    const scripts = doc.querySelectorAll('script[src]');
    if (scripts.length > 5) {
        issues.push({
            type: 'info',
            category: 'Performance',
            message: `Found ${scripts.length} external scripts. Consider bundling or deferring scripts to improve load time.`,
        });
    }

    // --- Accessibility ---

    const formInputs = doc.querySelectorAll('input, textarea, select');
    let inputsMissingLabel = 0;
    formInputs.forEach((input) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const hasAssociatedLabel = id ? !!doc.querySelector(`label[for="${id}"]`) : false;
        const parentLabel = input.closest('label');

        if (!ariaLabel && !ariaLabelledBy && !hasAssociatedLabel && !parentLabel) {
            inputsMissingLabel++;
        }
    });

    if (inputsMissingLabel > 0) {
        issues.push({
            type: 'warning',
            category: 'Accessibility',
            message: `${inputsMissingLabel} form input(s) lack associated labels. Add label elements or aria-label attributes.`,
        });
    }

    // --- Score calculation ---

    let score = 100;
    issues.forEach((issue) => {
        if (issue.type === 'error') score -= 15;
        else if (issue.type === 'warning') score -= 7;
        else if (issue.type === 'info') score -= 3;
    });

    score = Math.max(0, Math.min(100, score));

    return {
        score,
        issues,
        meta: {
            title: titleText || undefined,
            description: descContent || undefined,
            hasViewport,
            hasCharset,
            hasOgTags,
            hasOgTitle,
            hasOgDesc,
            hasOgImage,
            hasTwitterCard,
            hasCanonical,
            hasFavicon,
            headingStructure,
            imageCount,
            imagesWithAlt,
            linkCount,
        },
    };
}

function applyAutoFixes(html: string, analysis: SEOAnalysis): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fixableIssues = analysis.issues.filter((i) => i.fix);

    fixableIssues.forEach((issue) => {
        switch (issue.fix) {
            case 'add-viewport': {
                if (!doc.querySelector('meta[name="viewport"]')) {
                    const meta = doc.createElement('meta');
                    meta.setAttribute('name', 'viewport');
                    meta.setAttribute('content', 'width=device-width, initial-scale=1.0');
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.prepend(meta);
                }
                break;
            }
            case 'add-charset': {
                if (!doc.querySelector('meta[charset]') && !doc.querySelector('meta[http-equiv="Content-Type"]')) {
                    const meta = doc.createElement('meta');
                    meta.setAttribute('charset', 'UTF-8');
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.prepend(meta);
                }
                break;
            }
            case 'add-lang': {
                const htmlEl = doc.querySelector('html');
                if (htmlEl && !htmlEl.getAttribute('lang')) {
                    htmlEl.setAttribute('lang', 'en');
                }
                break;
            }
            case 'add-alt-text': {
                const images = doc.querySelectorAll('img');
                images.forEach((img) => {
                    if (!img.hasAttribute('alt')) {
                        img.setAttribute('alt', '');
                    }
                });
                break;
            }
            case 'add-meta-description': {
                if (!doc.querySelector('meta[name="description"]')) {
                    const firstP = doc.querySelector('p');
                    const descText = firstP?.textContent?.trim().slice(0, 160) || 'Page description';
                    const meta = doc.createElement('meta');
                    meta.setAttribute('name', 'description');
                    meta.setAttribute('content', descText);
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.appendChild(meta);
                }
                break;
            }
            case 'add-title': {
                if (!doc.querySelector('title')) {
                    const h1 = doc.querySelector('h1');
                    const titleText = h1?.textContent?.trim() || 'Untitled Page';
                    const titleEl = doc.createElement('title');
                    titleEl.textContent = titleText;
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.appendChild(titleEl);
                }
                break;
            }
            case 'add-favicon': {
                if (!doc.querySelector('link[rel="icon"]') && !doc.querySelector('link[rel="shortcut icon"]')) {
                    const link = doc.createElement('link');
                    link.setAttribute('rel', 'icon');
                    link.setAttribute('type', 'image/svg+xml');
                    link.setAttribute('href', 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>');
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.appendChild(link);
                }
                break;
            }
            case 'add-og-title': {
                if (!doc.querySelector('meta[property="og:title"]')) {
                    const title = doc.querySelector('title')?.textContent || doc.querySelector('h1')?.textContent || 'My Page';
                    const meta = doc.createElement('meta');
                    meta.setAttribute('property', 'og:title');
                    meta.setAttribute('content', title.trim());
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.appendChild(meta);
                }
                break;
            }
            case 'add-og-description': {
                if (!doc.querySelector('meta[property="og:description"]')) {
                    const desc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                                 doc.querySelector('p')?.textContent?.slice(0, 160) || 'Page description';
                    const meta = doc.createElement('meta');
                    meta.setAttribute('property', 'og:description');
                    meta.setAttribute('content', desc.trim());
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.appendChild(meta);
                }
                break;
            }
            case 'add-og-image': {
                if (!doc.querySelector('meta[property="og:image"]')) {
                    // Use first image if available, otherwise use placeholder
                    const firstImg = doc.querySelector('img');
                    const imgSrc = firstImg?.getAttribute('src') || '';
                    const meta = doc.createElement('meta');
                    meta.setAttribute('property', 'og:image');
                    meta.setAttribute('content', imgSrc || 'https://placehold.co/1200x630/png?text=Page+Preview');
                    const head = doc.head || doc.createElement('head');
                    if (!doc.head) doc.documentElement.prepend(head);
                    head.appendChild(meta);
                }
                break;
            }
            case 'fix-heading-hierarchy': {
                const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
                let currentLevel = 0;
                headings.forEach((heading) => {
                    const level = parseInt(heading.tagName[1], 10);
                    if (currentLevel > 0 && level > currentLevel + 1) {
                        const correctedLevel = currentLevel + 1;
                        const newHeading = doc.createElement(`h${correctedLevel}`);
                        newHeading.innerHTML = heading.innerHTML;
                        Array.from(heading.attributes).forEach((attr) => {
                            newHeading.setAttribute(attr.name, attr.value);
                        });
                        heading.parentNode?.replaceChild(newHeading, heading);
                        currentLevel = correctedLevel;
                    } else {
                        currentLevel = level;
                    }
                });
                break;
            }
        }
    });

    return doc.documentElement.outerHTML;
}

function getScoreColor(score: number): string {
    if (score < 40) return '#ef4444';
    if (score <= 70) return '#f59e0b';
    return '#22c55e';
}

function getSeverityColor(type: SEOIssue['type']): string {
    if (type === 'error') return '#ef4444';
    if (type === 'warning') return '#f59e0b';
    return '#3b82f6';
}

function getSeverityLabel(type: SEOIssue['type']): string {
    if (type === 'error') return 'Error';
    if (type === 'warning') return 'Warning';
    return 'Info';
}

export default function SEOAnalyzer({ isOpen, onClose, html, onAutoFix }: SEOAnalyzerProps) {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [fixApplied, setFixApplied] = useState(false);

    const analysis = useMemo<SEOAnalysis>(() => {
        if (!html) {
            return {
                score: 0,
                issues: [],
                meta: {
                    hasViewport: false,
                    hasCharset: false,
                    hasOgTags: false,
                    hasOgTitle: false,
                    hasOgDesc: false,
                    hasOgImage: false,
                    hasTwitterCard: false,
                    hasCanonical: false,
                    hasFavicon: false,
                    headingStructure: [],
                    imageCount: 0,
                    imagesWithAlt: 0,
                    linkCount: 0,
                },
            };
        }
        return analyzeHTML(html);
    }, [html]);

    const issuesByCategory = useMemo(() => {
        const grouped: Record<string, SEOIssue[]> = {};
        ISSUE_CATEGORIES.forEach((cat) => {
            grouped[cat] = [];
        });
        analysis.issues.forEach((issue) => {
            if (grouped[issue.category]) {
                grouped[issue.category].push(issue);
            } else {
                grouped[issue.category] = [issue];
            }
        });
        return grouped;
    }, [analysis]);

    const fixableCount = analysis.issues.filter((i) => i.fix).length;

    // Reset fixApplied when html changes
    useEffect(() => {
        setFixApplied(false);
    }, [html]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleAutoFix = () => {
        const fixedHtml = applyAutoFixes(html, analysis);
        onAutoFix(fixedHtml);
        setFixApplied(true);
    };

    const toggleCategory = (category: string) => {
        setExpandedCategory((prev) => (prev === category ? null : category));
    };

    if (!isOpen) return null;

    const scoreColor = getScoreColor(analysis.score);
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (analysis.score / 100) * circumference;

    const errorCount = analysis.issues.filter((i) => i.type === 'error').length;
    const warningCount = analysis.issues.filter((i) => i.type === 'warning').length;
    const infoCount = analysis.issues.filter((i) => i.type === 'info').length;

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div
                className="publish-modal seo-analyzer-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="seo-analyzer-title"
            >
                <div className="publish-modal-header">
                    <h2 id="seo-analyzer-title">
                        <ShieldIcon /> SEO Analyzer
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close SEO analyzer">
                        <XIcon />
                    </button>
                </div>

                <div className="publish-modal-body" style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                    {/* Score Meter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
                        <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                            <svg width="120" height="120" viewBox="0 0 120 120">
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                />
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="54"
                                    fill="none"
                                    stroke={scoreColor}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    transform="rotate(-90 60 60)"
                                    style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }}
                                />
                            </svg>
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: '28px', fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                                    {analysis.score}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                    / 100
                                </div>
                            </div>
                        </div>

                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                                {analysis.score > 70
                                    ? 'Good SEO Health'
                                    : analysis.score >= 40
                                    ? 'Needs Improvement'
                                    : 'Poor SEO Health'}
                            </div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                {analysis.issues.length === 0
                                    ? 'No issues found. Your page looks great!'
                                    : `Found ${analysis.issues.length} issue${analysis.issues.length !== 1 ? 's' : ''} across ${Object.values(issuesByCategory).filter((v) => v.length > 0).length} categories.`}
                            </div>

                            {fixableCount > 0 && (
                                <button
                                    onClick={handleAutoFix}
                                    disabled={fixApplied}
                                    style={{
                                        marginTop: '12px',
                                        padding: '8px 16px',
                                        background: fixApplied ? 'rgba(34, 197, 94, 0.2)' : 'var(--accent)',
                                        color: fixApplied ? '#22c55e' : '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: fixApplied ? 'default' : 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    {fixApplied ? (
                                        <>
                                            <CheckIcon /> Fixes Applied
                                        </>
                                    ) : (
                                        `Auto-Fix ${fixableCount} Issue${fixableCount !== 1 ? 's' : ''}`
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Summary Bar */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        padding: '12px 16px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#ef4444' }}>{errorCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Errors</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#f59e0b' }}>{warningCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Warnings</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: '#3b82f6' }}>{infoCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Info</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{analysis.meta.imageCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Images</div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>{analysis.meta.linkCount}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Links</div>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        marginBottom: '24px',
                    }}>
                        {[
                            { label: 'Title', ok: !!analysis.meta.title },
                            { label: 'Description', ok: !!analysis.meta.description },
                            { label: 'Viewport', ok: analysis.meta.hasViewport },
                            { label: 'Charset', ok: analysis.meta.hasCharset },
                            { label: 'OG Tags', ok: analysis.meta.hasOgTags },
                            { label: 'Twitter', ok: analysis.meta.hasTwitterCard },
                            { label: 'Canonical', ok: analysis.meta.hasCanonical },
                            { label: 'Favicon', ok: analysis.meta.hasFavicon },
                        ].map((item) => (
                            <div
                                key={item.label}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    background: item.ok ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    fontSize: '12px',
                                    color: item.ok ? '#22c55e' : '#ef4444',
                                    fontWeight: 500,
                                }}
                            >
                                {item.ok ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                )}
                                {item.label}
                            </div>
                        ))}
                    </div>

                    {/* Issues by Category */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {ISSUE_CATEGORIES.map((category) => {
                            const categoryIssues = issuesByCategory[category] || [];
                            if (categoryIssues.length === 0) return null;

                            const isExpanded = expandedCategory === category;
                            const catErrors = categoryIssues.filter((i) => i.type === 'error').length;
                            const catWarnings = categoryIssues.filter((i) => i.type === 'warning').length;
                            const catInfo = categoryIssues.filter((i) => i.type === 'info').length;

                            return (
                                <div
                                    key={category}
                                    style={{
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <button
                                        onClick={() => toggleCategory(category)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px 16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)',
                                            fontSize: '14px',
                                            fontWeight: 500,
                                        }}
                                    >
                                        <span>{category}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {catErrors > 0 && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: 'rgba(239, 68, 68, 0.15)',
                                                    color: '#ef4444',
                                                }}>
                                                    {catErrors}
                                                </span>
                                            )}
                                            {catWarnings > 0 && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: 'rgba(245, 158, 11, 0.15)',
                                                    color: '#f59e0b',
                                                }}>
                                                    {catWarnings}
                                                </span>
                                            )}
                                            {catInfo > 0 && (
                                                <span style={{
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    background: 'rgba(59, 130, 246, 0.15)',
                                                    color: '#3b82f6',
                                                }}>
                                                    {catInfo}
                                                </span>
                                            )}
                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                style={{
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s ease',
                                                    opacity: 0.5,
                                                }}
                                            >
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div style={{ padding: '4px 0' }}>
                                            {categoryIssues.map((issue, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: '10px',
                                                        padding: '10px 16px',
                                                        borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                                    }}
                                                >
                                                    <div
                                                        title={getSeverityLabel(issue.type)}
                                                        style={{
                                                            width: '8px',
                                                            height: '8px',
                                                            borderRadius: '50%',
                                                            background: getSeverityColor(issue.type),
                                                            flexShrink: 0,
                                                            marginTop: '5px',
                                                        }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{
                                                            fontSize: '13px',
                                                            color: 'var(--text-primary)',
                                                            lineHeight: 1.5,
                                                        }}>
                                                            {issue.message}
                                                        </div>
                                                        {issue.fix && (
                                                            <div style={{
                                                                fontSize: '11px',
                                                                color: 'var(--accent)',
                                                                marginTop: '4px',
                                                                fontWeight: 500,
                                                            }}>
                                                                Auto-fixable
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {analysis.issues.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '32px 16px',
                                color: 'var(--text-secondary)',
                            }}>
                                <div style={{ marginBottom: '8px' }}>
                                    <CheckIcon />
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 500, color: '#22c55e' }}>
                                    All checks passed
                                </div>
                                <div style={{ fontSize: '13px', marginTop: '4px' }}>
                                    Your page follows SEO best practices.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Heading Structure */}
                    {analysis.meta.headingStructure.length > 0 && (
                        <div style={{ marginTop: '24px' }}>
                            <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-secondary)',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}>
                                Heading Structure
                            </div>
                            <div style={{
                                padding: '12px 16px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: '12px',
                                fontFamily: 'monospace',
                                lineHeight: 1.8,
                                color: 'var(--text-secondary)',
                            }}>
                                {analysis.meta.headingStructure.map((h, i) => {
                                    const level = parseInt(h.charAt(1), 10);
                                    return (
                                        <div key={i} style={{ paddingLeft: `${(level - 1) * 16}px` }}>
                                            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
                                                {h.split(':')[0]}
                                            </span>
                                            <span>: {h.split(':').slice(1).join(':')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
