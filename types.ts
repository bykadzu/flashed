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
}

export type LibrarySortOption = 'newest' | 'oldest' | 'name' | 'size';

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
}