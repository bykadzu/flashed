/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

/**
 * ArtifactSkeleton - A single card skeleton matching the ArtifactCard layout.
 * Mimics the artifact-card structure: header bar + large preview content area.
 */
export function ArtifactSkeleton() {
    return (
        <div className="artifact-card skeleton-card">
            <div className="artifact-header skeleton-pulse">
                <span
                    className="skeleton-bar"
                    style={{ width: '80px', height: '14px', borderRadius: '4px' }}
                />
            </div>
            <div className="artifact-card-inner skeleton-content">
                <div className="skeleton-lines">
                    <div className="skeleton-pulse skeleton-bar" style={{ width: '90%', height: '12px' }} />
                    <div className="skeleton-pulse skeleton-bar" style={{ width: '75%', height: '12px' }} />
                    <div className="skeleton-pulse skeleton-bar" style={{ width: '85%', height: '12px' }} />
                    <div className="skeleton-pulse skeleton-bar" style={{ width: '60%', height: '12px' }} />
                    <div className="skeleton-pulse skeleton-bar" style={{ width: '70%', height: '12px' }} />
                    <div className="skeleton-pulse skeleton-bar" style={{ width: '80%', height: '12px' }} />
                </div>
                <div className="skeleton-shimmer" />
            </div>
        </div>
    );
}

/**
 * ArtifactGridSkeleton - Renders multiple ArtifactSkeleton cards in a row.
 * Used as a placeholder during initial generation loading.
 */
export function ArtifactGridSkeleton({ count = 3 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }, (_, i) => (
                <ArtifactSkeleton key={i} />
            ))}
        </>
    );
}

/**
 * TextSkeleton - A simple text line skeleton for inline loading placeholders.
 */
export function TextSkeleton({ width = '100%' }: { width?: string }) {
    return (
        <span
            className="skeleton-pulse skeleton-text"
            style={{ display: 'inline-block', width, height: '1em', borderRadius: '4px' }}
        />
    );
}

/**
 * ButtonSkeleton - A button-shaped skeleton for loading states in toolbars or action bars.
 */
export function ButtonSkeleton({ width = '80px' }: { width?: string }) {
    return (
        <span
            className="skeleton-pulse skeleton-button"
            style={{ display: 'inline-block', width, height: '36px', borderRadius: '8px' }}
        />
    );
}
