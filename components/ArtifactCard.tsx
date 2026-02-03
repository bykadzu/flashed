
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useMemo, useState } from 'react';
import { Artifact, Site, SitePage } from '../types';
import { GlobeIcon } from './Icons';
import PageNavigator from './PageNavigator';

interface ArtifactCardProps {
    artifact?: Artifact;
    site?: Site;
    isFocused: boolean;
    onClick: () => void;
    onAddPage?: () => void;
    onPageChange?: (pageId: string) => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    site,
    isFocused, 
    onClick,
    onAddPage,
    onPageChange
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);
    const [currentPageId, setCurrentPageId] = useState<string>(
        site?.pages.find(p => p.isHome)?.id || site?.pages[0]?.id || ''
    );

    // Update currentPageId when site pages change
    useEffect(() => {
        if (site && !site.pages.find(p => p.id === currentPageId)) {
            setCurrentPageId(site.pages[0]?.id || '');
        }
    }, [site, currentPageId]);

    // Get current content to display
    const currentPage = site?.pages.find(p => p.id === currentPageId);
    const displayContent = site ? currentPage : artifact;
    const html = site ? currentPage?.html || '' : artifact?.html || '';
    const status = site ? currentPage?.status : artifact?.status;
    const id = site ? (currentPage?.id || site.id) : artifact?.id || '';
    const styleName = site ? site.styleName : artifact?.styleName || '';
    const publishInfo = site?.publishInfo || artifact?.publishInfo;

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [html]);

    const isBlurring = status === 'streaming';

    const handlePageSelect = (pageId: string) => {
        setCurrentPageId(pageId);
        onPageChange?.(pageId);
    };

    // Inject helper script for interactions
    // 1. Intercept Link clicks (handle site navigation or prevent external)
    // 2. Intercept Image clicks (send message to parent for replacement)
    const srcDoc = useMemo(() => {
        if (!html) return '';
        
        // Build page mapping for internal navigation
        const pageMapping = site?.pages.map(p => ({ slug: p.slug, id: p.id })) || [];
        
        const script = `
        <script>
            (function() {
                const ARTIFACT_ID = "${id}";
                const IS_SITE = ${!!site};
                const PAGE_MAPPING = ${JSON.stringify(pageMapping)};
                
                document.addEventListener('click', function(e) {
                    const target = e.target;
                    
                    // Handle Links
                    const link = target.closest('a');
                    if (link) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const href = link.getAttribute('href');
                        
                        // Check for internal site navigation
                        if (IS_SITE && href) {
                            // Handle relative links like "/about" or "about.html" or "#about"
                            const cleanHref = href.replace(/^\\//, '').replace(/\\.html$/, '').replace(/^#/, '');
                            const targetPage = PAGE_MAPPING.find(p => 
                                p.slug === cleanHref || 
                                p.slug === href ||
                                cleanHref === '' && p.slug === 'home'
                            );
                            
                            if (targetPage) {
                                window.parent.postMessage({ 
                                    type: 'SITE_NAVIGATE', 
                                    artifactId: ARTIFACT_ID,
                                    pageId: targetPage.id
                                }, '*');
                                return;
                            }
                        }
                        
                        console.log('Link navigation prevented in preview:', href);
                        return;
                    }
                    
                    // Handle Images
                    if (target.tagName === 'IMG') {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Assign ID if missing so we can find it later
                        if (!target.hasAttribute('data-img-id')) {
                            target.setAttribute('data-img-id', 'img-' + Math.random().toString(36).substr(2, 9));
                        }
                        
                        const imgId = target.getAttribute('data-img-id');
                        
                        window.parent.postMessage({ 
                            type: 'IMAGE_CLICK', 
                            artifactId: ARTIFACT_ID, 
                            imgId: imgId 
                        }, '*');
                    }
                }, true);

                // Listen for updates from parent
                window.addEventListener('message', function(e) {
                    if (e.data && e.data.type === 'UPDATE_IMAGE') {
                        const img = document.querySelector('[data-img-id="' + e.data.imgId + '"]');
                        if (img) {
                            img.src = e.data.src;
                            // Also update srcset if it exists to avoid conflicts
                            img.removeAttribute('srcset');
                        }
                    }
                });
            })();
        </script>
        `;
        
        // Append script before body close, or at end
        if (html.includes('</body>')) {
            return html.replace('</body>', `${script}</body>`);
        } else {
            return html + script;
        }
    }, [html, id, site]);

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''} ${site ? 'site-mode' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{styleName}</span>
                {site && <span className="site-badge">📄 {site.pages.length} pages</span>}
            </div>
            {publishInfo && (
                <div className="published-badge" title={`Published at ${publishInfo.url}`}>
                    <GlobeIcon /> Live
                </div>
            )}
            {site && isFocused && (
                <PageNavigator
                    pages={site.pages}
                    currentPageId={currentPageId}
                    onPageSelect={handlePageSelect}
                    onAddPage={onAddPage}
                    compact={!isFocused}
                />
            )}
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {html}
                        </pre>
                    </div>
                )}
                <iframe 
                    id={`iframe-${id}`}
                    srcDoc={srcDoc} 
                    title={id} 
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                    className="artifact-iframe"
                />
            </div>
        </div>
    );
});

export default ArtifactCard;
