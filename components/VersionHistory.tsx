/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * VersionHistory - Timeline of changes to an artifact with restore capability
 */

import React, { useState } from 'react';
import { VersionEntry } from '../types';
import { XIcon, HistoryIcon, CheckIcon } from './Icons';

const calculateDiffPercent = (a: string, b: string): number => {
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 0;
    let diff = 0;
    for (let i = 0; i < maxLen; i++) {
        if (a[i] !== b[i]) diff++;
    }
    return Math.round((diff / maxLen) * 100);
};

const formatTime = (ts: number) =>
    new Date(ts).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });

interface VersionHistoryProps {
    isOpen: boolean;
    onClose: () => void;
    versions: VersionEntry[];
    currentHtml: string;
    onRestore: (version: VersionEntry) => void;
}

export default function VersionHistory({ isOpen, onClose, versions, currentHtml, onRestore }: VersionHistoryProps) {
    const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);

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

    // Reset preview when modal closes
    React.useEffect(() => {
        if (!isOpen) {
            setPreviewVersionId(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const sortedVersions = [...versions].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="publish-modal-overlay" onClick={onClose}>
            <div
                className="publish-modal"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '560px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="version-history-title"
            >
                <div className="publish-modal-header">
                    <h2 id="version-history-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HistoryIcon />
                        Version History
                    </h2>
                    <button className="close-button" onClick={onClose} aria-label="Close version history">
                        <XIcon />
                    </button>
                </div>

                <div className="publish-modal-body" style={{ overflowY: 'auto', flex: 1 }}>
                    {sortedVersions.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px',
                            color: 'var(--text-secondary)',
                        }}>
                            <HistoryIcon />
                            <p style={{ marginTop: '12px', fontSize: '1rem' }}>No versions yet</p>
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>
                                Versions will appear here as you make changes to this artifact.
                            </p>
                        </div>
                    ) : (
                        <div style={{ position: 'relative', paddingLeft: '24px' }}>
                            {/* Timeline line */}
                            <div style={{
                                position: 'absolute',
                                left: '7px',
                                top: '8px',
                                bottom: '8px',
                                width: '2px',
                                background: 'var(--border-color, rgba(255,255,255,0.1))',
                            }} />

                            {sortedVersions.map((version, index) => {
                                const isCurrent = version.html === currentHtml;
                                const prevVersion = sortedVersions[index + 1];
                                const diffPercent = prevVersion
                                    ? calculateDiffPercent(prevVersion.html, version.html)
                                    : null;
                                const isPreviewOpen = previewVersionId === version.id;

                                return (
                                    <div
                                        key={version.id}
                                        style={{
                                            position: 'relative',
                                            marginBottom: '16px',
                                            paddingLeft: '20px',
                                        }}
                                    >
                                        {/* Timeline dot */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '-20px',
                                            top: '8px',
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '50%',
                                            background: isCurrent
                                                ? 'var(--accent-color, #6c5ce7)'
                                                : 'var(--bg-secondary, #2a2a2a)',
                                            border: isCurrent
                                                ? '2px solid var(--accent-color, #6c5ce7)'
                                                : '2px solid var(--border-color, rgba(255,255,255,0.2))',
                                            zIndex: 1,
                                        }} />

                                        <div
                                            style={{
                                                background: isCurrent
                                                    ? 'rgba(108, 92, 231, 0.08)'
                                                    : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                                                border: isCurrent
                                                    ? '1px solid rgba(108, 92, 231, 0.3)'
                                                    : '1px solid var(--border-color, rgba(255,255,255,0.08))',
                                                borderRadius: '10px',
                                                padding: '14px 16px',
                                                cursor: 'pointer',
                                                transition: 'border-color 0.2s',
                                            }}
                                            onClick={() =>
                                                setPreviewVersionId(isPreviewOpen ? null : version.id)
                                            }
                                            onMouseEnter={e => {
                                                if (!isCurrent) {
                                                    (e.currentTarget as HTMLElement).style.borderColor =
                                                        'rgba(255,255,255,0.2)';
                                                }
                                            }}
                                            onMouseLeave={e => {
                                                if (!isCurrent) {
                                                    (e.currentTarget as HTMLElement).style.borderColor =
                                                        'var(--border-color, rgba(255,255,255,0.08))';
                                                }
                                            }}
                                        >
                                            {/* Header row */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: '8px',
                                            }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        flexWrap: 'wrap',
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.85rem',
                                                            color: 'var(--text-secondary)',
                                                        }}>
                                                            {formatTime(version.timestamp)}
                                                        </span>
                                                        {isCurrent && (
                                                            <span style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                color: 'var(--accent-color, #6c5ce7)',
                                                                background: 'rgba(108, 92, 231, 0.15)',
                                                                padding: '2px 8px',
                                                                borderRadius: '9999px',
                                                            }}>
                                                                <CheckIcon /> Current
                                                            </span>
                                                        )}
                                                    </div>
                                                    {version.label && (
                                                        <p style={{
                                                            margin: '4px 0 0',
                                                            fontSize: '0.9rem',
                                                            color: 'var(--text-primary)',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}>
                                                            {version.label}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Diff indicator + Restore button */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    flexShrink: 0,
                                                }}>
                                                    {diffPercent !== null && (
                                                        <span
                                                            title={`${diffPercent}% changed from previous version`}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 500,
                                                                color: diffPercent > 50
                                                                    ? '#e17055'
                                                                    : diffPercent > 20
                                                                        ? '#fdcb6e'
                                                                        : '#00b894',
                                                                background: diffPercent > 50
                                                                    ? 'rgba(225, 112, 85, 0.12)'
                                                                    : diffPercent > 20
                                                                        ? 'rgba(253, 203, 110, 0.12)'
                                                                        : 'rgba(0, 184, 148, 0.12)',
                                                                padding: '2px 8px',
                                                                borderRadius: '9999px',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            {diffPercent}% changed
                                                        </span>
                                                    )}
                                                    {!isCurrent && (
                                                        <button
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                onRestore(version);
                                                            }}
                                                            style={{
                                                                background: 'var(--accent-color, #6c5ce7)',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                padding: '6px 12px',
                                                                fontSize: '0.8rem',
                                                                fontWeight: 500,
                                                                cursor: 'pointer',
                                                                whiteSpace: 'nowrap',
                                                                transition: 'opacity 0.2s',
                                                            }}
                                                            onMouseEnter={e =>
                                                                ((e.currentTarget as HTMLElement).style.opacity = '0.85')
                                                            }
                                                            onMouseLeave={e =>
                                                                ((e.currentTarget as HTMLElement).style.opacity = '1')
                                                            }
                                                        >
                                                            Restore
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Preview iframe */}
                                            {isPreviewOpen && (
                                                <div style={{
                                                    marginTop: '12px',
                                                    borderRadius: '8px',
                                                    overflow: 'hidden',
                                                    border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
                                                    background: '#fff',
                                                    height: '200px',
                                                    position: 'relative',
                                                }}>
                                                    <iframe
                                                        srcDoc={version.html}
                                                        title={`Preview of version ${version.label || formatTime(version.timestamp)}`}
                                                        sandbox="allow-same-origin"
                                                        style={{
                                                            width: '200%',
                                                            height: '400px',
                                                            border: 'none',
                                                            transform: 'scale(0.5)',
                                                            transformOrigin: 'top left',
                                                            pointerEvents: 'none',
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
