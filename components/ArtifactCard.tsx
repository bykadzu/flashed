
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useRef, useMemo } from 'react';
import { Artifact } from '../types';
import { GlobeIcon } from './Icons';

interface ArtifactCardProps {
    artifact: Artifact;
    isFocused: boolean;
    onClick: () => void;
}

const ArtifactCard = React.memo(({ 
    artifact, 
    isFocused, 
    onClick 
}: ArtifactCardProps) => {
    const codeRef = useRef<HTMLPreElement>(null);

    // Auto-scroll logic for this specific card
    useEffect(() => {
        if (codeRef.current) {
            codeRef.current.scrollTop = codeRef.current.scrollHeight;
        }
    }, [artifact.html]);

    const isBlurring = artifact.status === 'streaming';

    // Inject helper script for interactions
    // 1. Intercept Link clicks (prevent navigation/errors)
    // 2. Intercept Image clicks (send message to parent for replacement)
    const srcDoc = useMemo(() => {
        if (!artifact.html) return '';
        
        const script = `
        <script>
            (function() {
                const ARTIFACT_ID = "${artifact.id}";
                
                document.addEventListener('click', function(e) {
                    const target = e.target;
                    
                    // Handle Links
                    if (target.closest('a')) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Link navigation prevented in preview');
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
        if (artifact.html.includes('</body>')) {
            return artifact.html.replace('</body>', `${script}</body>`);
        } else {
            return artifact.html + script;
        }
    }, [artifact.html, artifact.id]);

    return (
        <div 
            className={`artifact-card ${isFocused ? 'focused' : ''} ${isBlurring ? 'generating' : ''}`}
            onClick={onClick}
        >
            <div className="artifact-header">
                <span className="artifact-style-tag">{artifact.styleName}</span>
            </div>
            {artifact.publishInfo && (
                <div className="published-badge" title={`Published at ${artifact.publishInfo.url}`}>
                    <GlobeIcon /> Live
                </div>
            )}
            <div className="artifact-card-inner">
                {isBlurring && (
                    <div className="generating-overlay">
                        <pre ref={codeRef} className="code-stream-preview">
                            {artifact.html}
                        </pre>
                    </div>
                )}
                <iframe 
                    id={`iframe-${artifact.id}`}
                    srcDoc={srcDoc} 
                    title={artifact.id} 
                    sandbox="allow-scripts allow-forms allow-modals allow-popups allow-presentation allow-same-origin"
                    className="artifact-iframe"
                />
            </div>
        </div>
    );
});

export default ArtifactCard;
