/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ABVariant } from '../types';
import { XIcon, SparklesIcon, CheckIcon } from './Icons';

interface ABTestCategory {
    id: string;
    name: string;
    description: string;
    variantDescriptions: string[];
}

const AB_TEST_CATEGORIES: ABTestCategory[] = [
    {
        id: 'cta-variations',
        name: 'CTA Variations',
        description: 'Different call-to-action button text, colors, placement',
        variantDescriptions: [
            'Bold, high-contrast CTA button with urgency-driven copy ("Get Started Now") placed above the fold',
            'Subtle, text-link style CTA with benefit-focused copy ("See How It Works") placed after the value proposition',
            'Floating sticky CTA bar at the bottom of the viewport with action-oriented copy ("Claim Your Free Trial")',
        ],
    },
    {
        id: 'layout-alternatives',
        name: 'Layout Alternatives',
        description: 'Different section ordering and layout structures',
        variantDescriptions: [
            'Hero-first layout with features, then testimonials, then pricing, then final CTA',
            'Problem-solution layout leading with pain points, then showing the product as the answer',
            'Story-driven layout with narrative flow: context, challenge, solution, results, next steps',
        ],
    },
    {
        id: 'color-scheme-swap',
        name: 'Color Scheme Swap',
        description: 'Alternative color palettes (warm vs cool, etc.)',
        variantDescriptions: [
            'Warm palette with amber, coral, and cream tones for an inviting, energetic feel',
            'Cool palette with navy, teal, and slate tones for a professional, trustworthy feel',
            'High-contrast monochrome with a single bold accent color for a modern, striking look',
        ],
    },
    {
        id: 'copy-rewrite',
        name: 'Copy Rewrite',
        description: 'Different headline and body copy approaches',
        variantDescriptions: [
            'Direct, benefit-driven headlines focused on outcomes and measurable results',
            'Emotional, story-based copy that connects with the reader on a personal level',
            'Question-led copy that engages curiosity and addresses common objections',
        ],
    },
    {
        id: 'social-proof-focus',
        name: 'Social Proof Focus',
        description: 'Emphasize testimonials vs stats vs logos',
        variantDescriptions: [
            'Testimonial-heavy version with detailed customer quotes, photos, and case study snippets',
            'Statistics-focused version highlighting key numbers, metrics, and data-driven results',
            'Logo bar and partnership badges emphasizing brand trust and industry recognition',
        ],
    },
    {
        id: 'minimalist-vs-rich',
        name: 'Minimalist vs Rich',
        description: 'Stripped down vs feature-rich versions',
        variantDescriptions: [
            'Minimalist version with generous whitespace, single-column layout, and focused messaging',
            'Feature-rich version with multiple sections, detailed breakdowns, and comprehensive information',
            'Balanced hybrid with clean design but expandable sections for users who want more detail',
        ],
    },
];

interface ABTestGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    _originalHtml: string;
    _prompt: string;
    onGenerate: (category: string, description: string) => void;
    onApplyVariant: (html: string) => void;
    variants: ABVariant[];
    isGenerating: boolean;
}

export default function ABTestGenerator({
    isOpen,
    onClose,
    _originalHtml,
    _prompt,
    onGenerate,
    onApplyVariant,
    variants,
    isGenerating,
}: ABTestGeneratorProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [customDescription, setCustomDescription] = useState('');
    const [appliedVariantId, setAppliedVariantId] = useState<string | null>(null);

    const handleSelectCategory = (categoryId: string) => {
        setSelectedCategory(categoryId);
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setCustomDescription('');
    };

    const handleGenerate = (description: string) => {
        const category = selectedCategory || 'custom';
        onGenerate(category, description);
    };

    const handleGenerateCustom = () => {
        if (!customDescription.trim()) return;
        onGenerate('custom', customDescription.trim());
        setCustomDescription('');
    };

    const handleApplyVariant = (variant: ABVariant) => {
        onApplyVariant(variant.html);
        setAppliedVariantId(variant.id);
    };

    const selectedCategoryData = AB_TEST_CATEGORIES.find(c => c.id === selectedCategory);

    const getVariantForDescription = (description: string): ABVariant | undefined => {
        return variants.find(v => v.description === description && v.html !== '');
    };

    if (!isOpen) return null;

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div
                className="publish-modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '720px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="abtest-title"
            >
                <div className="publish-modal-header">
                    <h2 id="abtest-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <SparklesIcon /> A/B Test Generator
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close A/B test generator">
                        <XIcon />
                    </button>
                </div>

                <div className="publish-modal-body" style={{ flex: 1, overflowY: 'auto' }}>
                    {!selectedCategory ? (
                        /* Category selection view */
                        <div>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
                                Select an A/B test category to generate variant descriptions for your design.
                            </p>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '12px',
                                marginBottom: '24px',
                            }}>
                                {AB_TEST_CATEGORIES.map(category => (
                                    <button
                                        key={category.id}
                                        onClick={() => handleSelectCategory(category.id)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-start',
                                            padding: '16px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                            color: 'inherit',
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)';
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-color, #667eea)';
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                        }}
                                    >
                                        <strong style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                                            {category.name}
                                        </strong>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {category.description}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Custom test description */}
                            <div style={{
                                padding: '16px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        marginBottom: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    Custom A/B Test
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={customDescription}
                                        onChange={e => setCustomDescription(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleGenerateCustom();
                                        }}
                                        placeholder="Describe your own A/B test variant..."
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '6px',
                                            color: 'inherit',
                                            fontSize: '0.85rem',
                                        }}
                                    />
                                    <button
                                        onClick={handleGenerateCustom}
                                        disabled={!customDescription.trim() || isGenerating}
                                        style={{
                                            padding: '8px 16px',
                                            background: customDescription.trim() && !isGenerating
                                                ? 'var(--accent-color, #667eea)'
                                                : 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            cursor: customDescription.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                                            fontSize: '0.85rem',
                                            opacity: customDescription.trim() && !isGenerating ? 1 : 0.5,
                                        }}
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* Show already-generated variants */}
                            {variants.length > 0 && (
                                <div style={{ marginTop: '24px' }}>
                                    <h3 style={{ fontSize: '0.95rem', marginBottom: '12px' }}>
                                        Generated Variants ({variants.length})
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {variants.map(variant => (
                                            <VariantCard
                                                key={variant.id}
                                                variant={variant}
                                                onApply={handleApplyVariant}
                                                isApplied={appliedVariantId === variant.id}
                                                isGenerating={false}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Category detail view */
                        <div>
                            <button
                                onClick={handleBackToCategories}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 0',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    marginBottom: '12px',
                                }}
                            >
                                &larr; Back to categories
                            </button>

                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>
                                {selectedCategoryData?.name}
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: '20px', fontSize: '0.85rem' }}>
                                {selectedCategoryData?.description}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                                {selectedCategoryData?.variantDescriptions.map((description, index) => {
                                    const existingVariant = getVariantForDescription(description);
                                    const generated = !!existingVariant;

                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                padding: '16px',
                                                background: 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '10px',
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                gap: '12px',
                                                marginBottom: generated ? '12px' : 0,
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--text-secondary)',
                                                        marginBottom: '4px',
                                                        fontWeight: 600,
                                                    }}>
                                                        Variant {String.fromCharCode(65 + index)}
                                                    </div>
                                                    <p style={{
                                                        margin: 0,
                                                        fontSize: '0.85rem',
                                                        lineHeight: 1.5,
                                                    }}>
                                                        {description}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                                    {!generated && (
                                                        <button
                                                            onClick={() => handleGenerate(description)}
                                                            disabled={isGenerating}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 14px',
                                                                background: isGenerating
                                                                    ? 'rgba(255, 255, 255, 0.1)'
                                                                    : 'var(--accent-color, #667eea)',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                color: '#fff',
                                                                cursor: isGenerating ? 'not-allowed' : 'pointer',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 500,
                                                                opacity: isGenerating ? 0.5 : 1,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            <SparklesIcon />
                                                            {isGenerating ? 'Generating...' : 'Generate'}
                                                        </button>
                                                    )}
                                                    {generated && (
                                                        <button
                                                            onClick={() => handleApplyVariant(existingVariant!)}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px',
                                                                padding: '6px 14px',
                                                                background: appliedVariantId === existingVariant!.id
                                                                    ? 'rgba(72, 187, 120, 0.2)'
                                                                    : 'rgba(255, 255, 255, 0.1)',
                                                                border: appliedVariantId === existingVariant!.id
                                                                    ? '1px solid rgba(72, 187, 120, 0.4)'
                                                                    : '1px solid rgba(255, 255, 255, 0.15)',
                                                                borderRadius: '6px',
                                                                color: appliedVariantId === existingVariant!.id
                                                                    ? '#48bb78'
                                                                    : 'inherit',
                                                                cursor: 'pointer',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            <CheckIcon />
                                                            {appliedVariantId === existingVariant!.id ? 'Applied' : 'Apply'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Iframe preview for generated variants */}
                                            {generated && existingVariant && (
                                                <div style={{
                                                    borderRadius: '6px',
                                                    overflow: 'hidden',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    background: '#fff',
                                                    height: '180px',
                                                }}>
                                                    <iframe
                                                        srcDoc={existingVariant.html}
                                                        title={`Preview: Variant ${String.fromCharCode(65 + index)}`}
                                                        sandbox="allow-scripts"
                                                        style={{
                                                            width: '200%',
                                                            height: '360px',
                                                            border: 'none',
                                                            transform: 'scale(0.5)',
                                                            transformOrigin: 'top left',
                                                            pointerEvents: 'none',
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Custom variant within category */}
                            <div style={{
                                padding: '16px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                            }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        marginBottom: '8px',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    Custom Variant for {selectedCategoryData?.name}
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={customDescription}
                                        onChange={e => setCustomDescription(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleGenerateCustom();
                                        }}
                                        placeholder="Describe a custom variant..."
                                        style={{
                                            flex: 1,
                                            padding: '8px 12px',
                                            background: 'rgba(255, 255, 255, 0.06)',
                                            border: '1px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '6px',
                                            color: 'inherit',
                                            fontSize: '0.85rem',
                                        }}
                                    />
                                    <button
                                        onClick={handleGenerateCustom}
                                        disabled={!customDescription.trim() || isGenerating}
                                        style={{
                                            padding: '8px 16px',
                                            background: customDescription.trim() && !isGenerating
                                                ? 'var(--accent-color, #667eea)'
                                                : 'rgba(255, 255, 255, 0.1)',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#fff',
                                            cursor: customDescription.trim() && !isGenerating ? 'pointer' : 'not-allowed',
                                            fontSize: '0.85rem',
                                            opacity: customDescription.trim() && !isGenerating ? 1 : 0.5,
                                        }}
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* Internal sub-component for displaying a generated variant card */
function VariantCard({
    variant,
    onApply,
    isApplied,
    isGenerating,
}: {
    variant: ABVariant;
    onApply: (variant: ABVariant) => void;
    isApplied: boolean;
    isGenerating: boolean;
}) {
    const hasHtml = variant.html !== '';

    return (
        <div style={{
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: hasHtml ? '12px' : 0,
            }}>
                <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: '0.9rem' }}>{variant.name}</strong>
                    <p style={{
                        margin: '4px 0 0',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                    }}>
                        {variant.description}
                    </p>
                </div>
                {hasHtml && (
                    <button
                        onClick={() => onApply(variant)}
                        disabled={isGenerating}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 14px',
                            background: isApplied
                                ? 'rgba(72, 187, 120, 0.2)'
                                : 'rgba(255, 255, 255, 0.1)',
                            border: isApplied
                                ? '1px solid rgba(72, 187, 120, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '6px',
                            color: isApplied ? '#48bb78' : 'inherit',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}
                    >
                        <CheckIcon />
                        {isApplied ? 'Applied' : 'Apply'}
                    </button>
                )}
            </div>

            {/* Iframe preview for generated variants */}
            {hasHtml && (
                <div style={{
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    background: '#fff',
                    height: '160px',
                }}>
                    <iframe
                        srcDoc={variant.html}
                        title={`Preview: ${variant.name}`}
                        sandbox="allow-scripts"
                        style={{
                            width: '200%',
                            height: '320px',
                            border: 'none',
                            transform: 'scale(0.5)',
                            transformOrigin: 'top left',
                            pointerEvents: 'none',
                        }}
                    />
                </div>
            )}
        </div>
    );
}
