/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// ============ SEO & Publishing ============
export interface SEOSettings {
    title: string;
    description: string;
    ogImage?: string;
    favicon?: string;
}

export interface PublishInfo {
    url: string;
    shortId: string;
    publishedAt: number;
    version: number;
}

export interface FormSettings {
    enabled: boolean;
    webhookUrl?: string;
    emailTo?: string;
    provider: 'webhook' | 'email' | 'formspree';
    formspreeId?: string;
}

// ============ Core Types ============
export interface Artifact {
    id: string;
    styleName: string;
    html: string;
    status: 'streaming' | 'complete' | 'error';
    // Phase 1 additions
    seo?: SEOSettings;
    publishInfo?: PublishInfo;
    formSettings?: FormSettings;
}

// ============ Multi-Page Site Types ============
export interface SitePage {
    id: string;
    name: string;
    slug: string;
    html: string;
    status: 'streaming' | 'complete' | 'error';
    isHome?: boolean;
}

export interface Site {
    id: string;
    name: string;
    styleName: string;
    pages: SitePage[];
    sharedStyles?: string;
    sharedNav?: string;
    seo?: SEOSettings;
    publishInfo?: PublishInfo;
    formSettings?: FormSettings;
}

export interface Session {
    id: string;
    prompt: string;
    timestamp: number;
    artifacts: Artifact[];
    projectId?: string;
    // Multi-site support
    site?: Site;
    mode?: 'single' | 'site';
    // Multi-variant support
    variantCount?: number;
}

export interface ComponentVariation { name: string; html: string; }
export interface LayoutOption { name: string; css: string; previewHtml: string; }

// ============ Phase 2: Projects & Brand Kits ============
export interface BrandKit {
    id: string;
    name: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    logoUrl?: string;
}

export interface Project {
    id: string;
    name: string;
    clientName?: string;
    brandKit?: BrandKit;
    createdAt: number;
    updatedAt: number;
}

// ============ Phase 3: Analytics ============
export interface PageView {
    id: string;
    pageId: string;
    timestamp: number;
    referrer?: string;
    userAgent?: string;
    country?: string;
}

export interface FormSubmission {
    id: string;
    pageId: string;
    timestamp: number;
    data: Record<string, string>;
    notified: boolean;
}

// ============ HTML Library Types ============
export interface HTMLItem {
    id: string;
    title: string;
    description?: string;
    content: string; // The raw HTML content
    createdAt: number;
    tags: string[];
    thumbnail?: string; // Optional screenshot/preview
    size: number;
    prompt?: string; // Original prompt used to generate
    batchId?: string; // Groups batch-saved library items
    batchIndex?: number; // Position within batch
    sourceType?: 'html' | 'jsx'; // Tracks whether content was compiled from JSX
    originalSource?: string; // Stores raw JSX/TSX source for re-editing
}

export type LibrarySortOption = 'newest' | 'oldest' | 'name' | 'size';

// ============ Phase 2: Version History ============
export interface VersionEntry {
    id: string;
    artifactId: string;
    html: string;
    timestamp: number;
    label?: string; // e.g. "Initial generation", "Refinement: make it darker"
}

// ============ Phase 2: Keyboard Shortcuts ============
export interface KeyboardShortcut {
    key: string;
    modifiers: ('ctrl' | 'meta' | 'shift' | 'alt')[];
    action: string;
    description: string;
    category: 'navigation' | 'actions' | 'generation' | 'editing';
}

// ============ Phase 2: SEO Analysis ============
export interface SEOIssue {
    type: 'error' | 'warning' | 'info';
    category: string;
    message: string;
    fix?: string;
}

export interface SEOAnalysis {
    score: number; // 0-100
    issues: SEOIssue[];
    meta: {
        title?: string;
        description?: string;
        hasViewport: boolean;
        hasCharset: boolean;
        hasOgTags: boolean;
        hasOgTitle?: boolean;
        hasOgDesc?: boolean;
        hasOgImage?: boolean;
        hasOgUrl?: boolean;
        hasTwitterCard: boolean;
        hasCanonical: boolean;
        hasFavicon: boolean;
        headingStructure: string[];
        imageCount: number;
        imagesWithAlt: number;
        linkCount: number;
    };
}

// ============ Phase 2: Component Extraction ============
export interface ExtractedComponent {
    id: string;
    name: string;
    html: string;
    css: string;
    type: 'header' | 'hero' | 'features' | 'pricing' | 'testimonials' | 'footer' | 'cta' | 'nav' | 'form' | 'gallery' | 'other';
    description: string;
}

// ============ Phase 2: A/B Testing ============
export interface ABVariant {
    id: string;
    name: string;
    html: string;
    description: string;
}

export interface ABTest {
    id: string;
    originalArtifactId: string;
    variants: ABVariant[];
    createdAt: number;
    prompt: string;
}

// ============ Phase 2: Export Formats ============
export type ExportFormat = 'html' | 'react' | 'vue';

// ============ Phase 2: Draft Auto-Save ============
export interface Draft {
    id: string;
    prompt: string;
    imageData?: string;
    brandKitId?: string;
    siteMode: boolean;
    pageStructure?: string;
    timestamp: number;
}

// ============ Database Types ============
export interface PublishedPage {
    id: string;
    short_id: string;
    html: string;
    seo_title: string;
    seo_description: string;
    og_image?: string;
    form_settings?: FormSettings;
    created_at: string;
    updated_at: string;
    version: number;
    views: number;
    user_id?: string;
    project_id?: string;
    custom_domain?: string;
    batch_id?: string; // Groups published batch pages
}