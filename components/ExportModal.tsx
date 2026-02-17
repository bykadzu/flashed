/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * ExportModal - Export generated HTML designs to HTML, React, or Vue formats
 */

import React, { useState, useMemo } from 'react';
import { ExportFormat } from '../types';
import { XIcon, DownloadIcon, CodeIcon, CheckIcon } from './Icons';
import { COPY_FEEDBACK_DURATION } from '../constants';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    html: string;
    title: string;
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
    html: 'HTML',
    react: 'React',
    vue: 'Vue',
};

/**
 * Convert an inline CSS style string (e.g. "color: red; font-size: 14px;")
 * into a React style object string (e.g. '{ color: "red", fontSize: "14px" }').
 */
function styleStringToObject(styleStr: string): string {
    const declarations = styleStr
        .split(';')
        .map(d => d.trim())
        .filter(Boolean);

    if (declarations.length === 0) return '{}';

    const pairs = declarations.map(declaration => {
        const colonIdx = declaration.indexOf(':');
        if (colonIdx === -1) return null;
        const rawProp = declaration.slice(0, colonIdx).trim();
        const value = declaration.slice(colonIdx + 1).trim();

        // Convert kebab-case to camelCase
        const camelProp = rawProp.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());

        // If the value is purely numeric (with optional px/em/rem suffix that is just a number),
        // keep it as a number for unitless values, otherwise wrap as string.
        const numericOnly = /^-?\d+(\.\d+)?$/.test(value);
        const formattedValue = numericOnly ? value : `"${value}"`;

        return `${camelProp}: ${formattedValue}`;
    }).filter(Boolean);

    return `{ ${pairs.join(', ')} }`;
}

/**
 * Convert raw HTML to a React functional component string.
 */
function convertToReact(html: string, componentName: string): string {
    let jsx = html;

    // Convert class= to className=
    jsx = jsx.replace(/\bclass=/g, 'className=');

    // Convert for= to htmlFor=
    jsx = jsx.replace(/\bfor=/g, 'htmlFor=');

    // Convert inline style strings to style objects
    // Matches style="..." attributes
    jsx = jsx.replace(/style="([^"]*)"/g, (_match, styleStr: string) => {
        const obj = styleStringToObject(styleStr);
        return `style={${obj}}`;
    });

    // Convert self-closing void elements that lack a trailing slash
    // e.g. <br> -> <br />, <img ...> -> <img ... />, <hr> -> <hr />, <input ...> -> <input ... />
    const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    for (const tag of voidElements) {
        const regex = new RegExp(`<(${tag})(\\b[^>]*?)(?<!\\/)>`, 'gi');
        jsx = jsx.replace(regex, '<$1$2 />');
    }

    // Convert HTML comments to JSX comments
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/* $1 */}');

    // Convert tabindex= to tabIndex=
    jsx = jsx.replace(/\btabindex=/g, 'tabIndex=');

    // Convert readonly to readOnly
    jsx = jsx.replace(/\breadonly\b/g, 'readOnly');

    // Convert autocomplete= to autoComplete=
    jsx = jsx.replace(/\bautocomplete=/g, 'autoComplete=');

    // Extract <style> blocks as a separate CSS string
    let extractedCss = '';
    jsx = jsx.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_match, css: string) => {
        extractedCss += css.trim() + '\n';
        return '';
    });

    const cssSection = extractedCss.trim()
        ? `\nconst styles = \`\n${extractedCss.trim()}\n\`;\n`
        : '';

    const styleInject = extractedCss.trim()
        ? '\n            <style dangerouslySetInnerHTML={{ __html: styles }} />'
        : '';

    // Indent the JSX body
    const indentedJsx = jsx
        .split('\n')
        .map(line => `            ${line}`)
        .join('\n')
        .trim();

    return `import React from 'react';
${cssSection}
export default function ${componentName}() {
    return (
        <>
            ${styleInject ? styleInject.trim() + '\n            ' : ''}${indentedJsx}
        </>
    );
}
`;
}

/**
 * Convert raw HTML to a Vue Single File Component (SFC) string.
 */
function convertToVue(html: string, componentName: string): string {
    // Extract <style> blocks for scoped styles
    let extractedCss = '';
    let templateHtml = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (_match, css: string) => {
        extractedCss += css.trim() + '\n';
        return '';
    });

    templateHtml = templateHtml.trim();

    // If template has multiple root elements, wrap in a div
    // Simple heuristic: count top-level opening tags
    const tempDiv = templateHtml;
    const topLevelTags = tempDiv.replace(/<!--[\s\S]*?-->/g, '').trim();
    const openingTagCount = (topLevelTags.match(/^<[a-zA-Z]/gm) || []).length;

    if (openingTagCount > 1) {
        templateHtml = `    <div>\n        ${templateHtml.split('\n').join('\n        ')}\n    </div>`;
    } else {
        templateHtml = templateHtml.split('\n').map(line => `    ${line}`).join('\n');
    }

    const styleSection = extractedCss.trim()
        ? `\n<style scoped>\n${extractedCss.trim()}\n</style>\n`
        : '';

    return `<template>
${templateHtml}
</template>

<script setup>
// ${componentName} component
// Generated from HTML export
</script>
${styleSection}`;
}

/**
 * Sanitize a title string into a valid component/file name.
 */
function toComponentName(title: string): string {
    const cleaned = title
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');

    return cleaned || 'ExportedComponent';
}

function getFileExtension(format: ExportFormat): string {
    switch (format) {
        case 'html': return 'html';
        case 'react': return 'tsx';
        case 'vue': return 'vue';
    }
}

function getFileMimeType(format: ExportFormat): string {
    switch (format) {
        case 'html': return 'text/html';
        case 'react': return 'text/typescript';
        case 'vue': return 'text/plain';
    }
}

export default function ExportModal({ isOpen, onClose, html, title }: ExportModalProps) {
    const [activeFormat, setActiveFormat] = useState<ExportFormat>('html');
    const [copied, setCopied] = useState(false);

    const componentName = useMemo(() => toComponentName(title), [title]);

    const convertedOutput = useMemo(() => {
        switch (activeFormat) {
            case 'html':
                return html;
            case 'react':
                return convertToReact(html, componentName);
            case 'vue':
                return convertToVue(html, componentName);
        }
    }, [activeFormat, html, componentName]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(convertedOutput);
            setCopied(true);
            setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
        } catch {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = convertedOutput;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
        }
    };

    const handleDownload = () => {
        const ext = getFileExtension(activeFormat);
        const mimeType = getFileMimeType(activeFormat);
        const fileName = activeFormat === 'html'
            ? `${title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.${ext}`
            : `${componentName}.${ext}`;

        const blob = new Blob([convertedOutput], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Handle escape key
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset copy state when switching formats
    React.useEffect(() => {
        setCopied(false);
    }, [activeFormat]);

    if (!isOpen) return null;

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div
                className="publish-modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '720px' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="export-title"
            >
                <div className="publish-modal-header">
                    <h2 id="export-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CodeIcon />
                        Export: {title}
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close export dialog">
                        <XIcon />
                    </button>
                </div>

                <div className="publish-tabs">
                    {(['html', 'react', 'vue'] as ExportFormat[]).map(format => (
                        <button
                            key={format}
                            className={`publish-tab ${activeFormat === format ? 'active' : ''}`}
                            onClick={() => setActiveFormat(format)}
                        >
                            {FORMAT_LABELS[format]}
                        </button>
                    ))}
                </div>

                <div className="publish-modal-body">
                    <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {activeFormat === 'html' && 'Raw HTML output'}
                            {activeFormat === 'react' && `React functional component (${componentName}.tsx)`}
                            {activeFormat === 'vue' && `Vue Single File Component (${componentName}.vue)`}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '2px 8px',
                            borderRadius: '4px',
                        }}>
                            {convertedOutput.length.toLocaleString()} chars
                        </span>
                    </div>

                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        maxHeight: '400px',
                        overflow: 'auto',
                    }}>
                        <pre style={{
                            margin: 0,
                            padding: '16px',
                            fontSize: '0.8rem',
                            lineHeight: '1.5',
                            color: 'var(--text-primary)',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            fontFamily: '"SF Mono", "Fira Code", "Fira Mono", Menlo, Consolas, monospace',
                        }}>
                            <code>{convertedOutput}</code>
                        </pre>
                    </div>

                    {activeFormat === 'react' && (
                        <div style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                        }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong>{' '}
                            Inline styles are converted to object syntax. CSS class names are converted
                            to className. Review the output for any manual adjustments needed (event handlers,
                            dynamic data binding, etc.).
                        </div>
                    )}

                    {activeFormat === 'vue' && (
                        <div style={{
                            marginTop: '12px',
                            padding: '10px 14px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.5',
                        }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Note:</strong>{' '}
                            The HTML is wrapped in a Vue SFC with {'<script setup>'} and scoped styles.
                            Add your reactive data, methods, and props as needed.
                        </div>
                    )}
                </div>

                <div className="publish-modal-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                        className="publish-btn secondary"
                        onClick={handleCopy}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        {copied ? <CheckIcon /> : <CodeIcon />}
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                        className="publish-btn primary"
                        onClick={handleDownload}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <DownloadIcon />
                        Download .{getFileExtension(activeFormat)}
                    </button>
                </div>
            </div>
        </div>
    );
}
