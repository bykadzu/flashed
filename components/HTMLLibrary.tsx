/**
 * HTMLLibrary - Visual library of saved HTML pages
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HTMLItem, LibrarySortOption } from '../types';
import * as library from '../lib/htmlLibrary';
import { XIcon, DownloadIcon, SearchIcon, TrashIcon, LayersIcon, UploadIcon } from './Icons';
import ConfirmModal from './ConfirmModal';

interface HTMLLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem?: (item: HTMLItem, preserveStyling: boolean) => void;
}

export default function HTMLLibrary({ isOpen, onClose, onSelectItem }: HTMLLibraryProps) {
    const [items, setItems] = useState<HTMLItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<LibrarySortOption>('newest');
    const [selectedItem, setSelectedItem] = useState<HTMLItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<HTMLItem | null>(null);
    const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
    const [preserveStyling, setPreserveStyling] = useState(true);
    const [groupByBatch, setGroupByBatch] = useState(false);
    const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load library on open
    useEffect(() => {
        if (isOpen) {
            setItems(library.getLibrary());
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                if (isSortDropdownOpen) {
                    setIsSortDropdownOpen(false);
                } else {
                    onClose();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose, isSortDropdownOpen]);

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (isSortDropdownOpen && !target.closest('.library-sort-dropdown')) {
                setIsSortDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isSortDropdownOpen]);

    const filteredItems = useMemo(() => {
        let result = items.filter(item => {
            const q = searchQuery.toLowerCase();
            return (
                item.title.toLowerCase().includes(q) ||
                (item.description?.toLowerCase().includes(q)) ||
                item.tags.some(tag => tag.toLowerCase().includes(q))
            );
        });

        return result.sort((a, b) => {
            switch (sortOption) {
                case 'newest': return b.createdAt - a.createdAt;
                case 'oldest': return a.createdAt - b.createdAt;
                case 'name': return a.title.localeCompare(b.title);
                case 'size': return b.size - a.size;
                default: return 0;
            }
        });
    }, [items, searchQuery, sortOption]);

    const groupedItems = useMemo(() => {
        if (!groupByBatch) return null;

        const batches = new Map<string, HTMLItem[]>();
        const ungrouped: HTMLItem[] = [];

        for (const item of filteredItems) {
            if (item.batchId) {
                const existing = batches.get(item.batchId) || [];
                existing.push(item);
                batches.set(item.batchId, existing);
            } else {
                ungrouped.push(item);
            }
        }

        // Sort batch items by batchIndex
        for (const [, batchItems] of batches) {
            batchItems.sort((a, b) => (a.batchIndex ?? 0) - (b.batchIndex ?? 0));
        }

        return { batches, ungrouped };
    }, [filteredItems, groupByBatch]);

    const toggleBatchExpanded = (batchId: string) => {
        setExpandedBatches(prev => {
            const next = new Set(prev);
            if (next.has(batchId)) next.delete(batchId);
            else next.add(batchId);
            return next;
        });
    };

    const hasBatchItems = items.some(item => item.batchId);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        let uploadCount = 0;

        for (const file of Array.from(files)) {
            if (!file.name.endsWith('.html') && !file.name.endsWith('.htm')) continue;

            try {
                const content = await file.text();
                // Extract title from HTML or use filename
                const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
                const title = titleMatch ? titleMatch[1].trim() : file.name.replace(/\.html?$/i, '');

                const item = library.createLibraryItem(
                    content,
                    `Uploaded from ${file.name}`,
                    title,
                    ['uploaded']
                );
                library.saveItem(item);
                uploadCount++;
            } catch (err) {
                console.error(`Failed to read file: ${file.name}`, err);
            }
        }

        if (uploadCount > 0) {
            setItems(library.getLibrary());
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteClick = (item: HTMLItem) => {
        setItemToDelete(item);
    };

    const handleConfirmDelete = () => {
        if (itemToDelete) {
            const updated = library.deleteItem(itemToDelete.id);
            setItems(updated);
            if (selectedItem?.id === itemToDelete.id) {
                setSelectedItem(null);
            }
            setItemToDelete(null);
        }
    };

    const handleDownload = (item: HTMLItem) => {
        const blob = new Blob([item.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${item.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatSize = (bytes: number) => {
        if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${bytes} B`;
    };

    if (!isOpen) return null;

    return (
        <div className="library-overlay" onClick={onClose}>
            <div className="library-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="library-title">
                {/* Header */}
                <div className="library-header">
                    <div>
                        <h2 id="library-title">Your Library</h2>
                        <p className="library-subtitle">{items.length} saved pages</p>
                    </div>
                    <button className="close-button" onClick={onClose} aria-label="Close library">
                        <XIcon />
                    </button>
                </div>

                {/* Search & Sort Bar */}
                <div className="library-toolbar">
                    <div className="library-search">
                        <SearchIcon />
                        <input
                            type="text"
                            placeholder="Search pages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="library-sort-dropdown">
                        <button
                            className="library-sort-btn"
                            onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                            aria-expanded={isSortDropdownOpen}
                            aria-haspopup="listbox"
                        >
                            <span>{sortOption === 'newest' ? 'Newest' : sortOption === 'oldest' ? 'Oldest' : sortOption === 'name' ? 'Name' : 'Size'}</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 9l6 6 6-6"/>
                            </svg>
                        </button>
                        {isSortDropdownOpen && (
                            <div className="library-sort-options" role="listbox">
                                {(['newest', 'oldest', 'name', 'size'] as LibrarySortOption[]).map(option => (
                                    <button
                                        key={option}
                                        className={`library-sort-option ${sortOption === option ? 'active' : ''}`}
                                        onClick={() => {
                                            setSortOption(option);
                                            setIsSortDropdownOpen(false);
                                        }}
                                        role="option"
                                        aria-selected={sortOption === option}
                                    >
                                        {option === 'newest' ? 'Newest' : option === 'oldest' ? 'Oldest' : option === 'name' ? 'Name' : 'Size'}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upload Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleUpload}
                        accept=".html,.htm"
                        multiple
                        style={{ display: 'none' }}
                    />
                    <button
                        className="library-upload-btn"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label="Upload HTML files"
                    >
                        <UploadIcon /> Upload
                    </button>

                    {hasBatchItems && (
                        <button
                            className={`library-group-toggle ${groupByBatch ? 'active' : ''}`}
                            onClick={() => setGroupByBatch(!groupByBatch)}
                            aria-label="Group by batch"
                        >
                            <LayersIcon /> Group
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="library-content">
                    {filteredItems.length === 0 ? (
                        <div className="library-empty">
                            <LayersIcon />
                            <h3>Library is empty</h3>
                            <p>Generate a page and click "Save to Library" to add it here.</p>
                        </div>
                    ) : groupByBatch && groupedItems ? (
                        <div className="library-grid">
                            {/* Render batch groups */}
                            {Array.from(groupedItems.batches.entries()).map(([batchId, batchItems]) => {
                                const isExpanded = expandedBatches.has(batchId);
                                const firstItem = batchItems[0];
                                return (
                                    <React.Fragment key={`batch-${batchId}`}>
                                        <div className="batch-group" style={{ gridColumn: '1 / -1' }}>
                                            <div className="batch-group-header" onClick={() => toggleBatchExpanded(batchId)}>
                                                <div className="batch-info">
                                                    <LayersIcon />
                                                    <span>{firstItem.prompt?.slice(0, 40) || 'Batch'}</span>
                                                    <span className="batch-count">{batchItems.length} variants</span>
                                                </div>
                                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                                                    {isExpanded ? '▼' : '▶'} {formatDate(firstItem.createdAt)}
                                                </span>
                                            </div>
                                            {!isExpanded && (
                                                <div className="batch-stacked-preview" onClick={() => toggleBatchExpanded(batchId)}>
                                                    {batchItems.slice(0, 3).map((item, i) => (
                                                        <div key={item.id} className="batch-stack-card" />
                                                    ))}
                                                </div>
                                            )}
                                            {isExpanded && (
                                                <div className="batch-group-items">
                                                    {batchItems.map(item => (
                                                        <div
                                                            key={item.id}
                                                            className={`library-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                                            onClick={() => setSelectedItem(item)}
                                                        >
                                                            <div className="library-card-preview">
                                                                <div className="library-card-iframe-wrapper">
                                                                    <iframe srcDoc={item.content} title={item.title} sandbox="allow-same-origin" />
                                                                </div>
                                                                <div className="library-card-overlay"><span>View</span></div>
                                                            </div>
                                                            <div className="library-card-info">
                                                                <h4>{item.title}</h4>
                                                                <div className="library-card-meta">
                                                                    <span>{formatDate(item.createdAt)}</span>
                                                                    <span>{formatSize(item.size)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="library-card-actions">
                                                                <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} title="Download" aria-label="Download page"><DownloadIcon /></button>
                                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }} title="Delete" aria-label="Delete page" className="delete-btn"><TrashIcon /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                            {/* Render ungrouped items */}
                            {groupedItems.ungrouped.map(item => (
                                <div
                                    key={item.id}
                                    className={`library-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    <div className="library-card-preview">
                                        <div className="library-card-iframe-wrapper">
                                            <iframe srcDoc={item.content} title={item.title} sandbox="allow-same-origin" />
                                        </div>
                                        <div className="library-card-overlay"><span>View</span></div>
                                    </div>
                                    <div className="library-card-info">
                                        <h4>{item.title}</h4>
                                        {item.description && <p className="library-card-desc">{item.description}</p>}
                                        <div className="library-card-meta">
                                            <span>{formatDate(item.createdAt)}</span>
                                            <span>{formatSize(item.size)}</span>
                                        </div>
                                    </div>
                                    <div className="library-card-actions">
                                        <button onClick={(e) => { e.stopPropagation(); handleDownload(item); }} title="Download" aria-label="Download page"><DownloadIcon /></button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }} title="Delete" aria-label="Delete page" className="delete-btn"><TrashIcon /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="library-grid">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`library-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedItem(item)}
                                >
                                    {/* Preview */}
                                    <div className="library-card-preview">
                                        <div className="library-card-iframe-wrapper">
                                            <iframe
                                                srcDoc={item.content}
                                                title={item.title}
                                                sandbox="allow-same-origin"
                                            />
                                        </div>
                                        <div className="library-card-overlay">
                                            <span>View</span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="library-card-info">
                                        <h4>{item.title}</h4>
                                        {item.description && (
                                            <p className="library-card-desc">{item.description}</p>
                                        )}
                                        <div className="library-card-meta">
                                            <span>{formatDate(item.createdAt)}</span>
                                            <span>{formatSize(item.size)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="library-card-actions">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(item); }}
                                            title="Download"
                                            aria-label="Download page"
                                        >
                                            <DownloadIcon />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(item); }}
                                            title="Delete"
                                            aria-label="Delete page"
                                            className="delete-btn"
                                        >
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detail View (when item selected) */}
                {selectedItem && (
                    <div className="library-detail">
                        <div className="library-detail-header">
                            <button onClick={() => setSelectedItem(null)} className="back-btn">
                                ← Back
                            </button>
                            <h3>{selectedItem.title}</h3>
                            <div className="library-detail-actions">
                                <button onClick={() => handleDownload(selectedItem)}>
                                    <DownloadIcon /> Download
                                </button>
                                {onSelectItem && (
                                    <button
                                        className="primary"
                                        onClick={() => {
                                            onSelectItem(selectedItem, preserveStyling);
                                            onClose();
                                        }}
                                    >
                                        Use This Page
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Styling Toggle */}
                        {onSelectItem && (
                            <div className="library-styling-toggle">
                                <label className="toggle-label">
                                    <span className="toggle-text">
                                        <strong>Preserve Styling</strong>
                                        <small>{preserveStyling ? 'Keep original colors, fonts & CSS' : 'Strip styles (use with Brand Kit)'}</small>
                                    </span>
                                    <div className={`toggle-switch ${preserveStyling ? 'active' : ''}`} onClick={() => setPreserveStyling(!preserveStyling)}>
                                        <div className="toggle-knob" />
                                    </div>
                                </label>
                            </div>
                        )}
                        <div className="library-detail-preview">
                            <iframe
                                srcDoc={selectedItem.content}
                                title={selectedItem.title}
                                sandbox="allow-same-origin"
                            />
                        </div>
                        {selectedItem.prompt && (
                            <div className="library-detail-prompt">
                                <strong>Original prompt:</strong> {selectedItem.prompt}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Page"
                message={`Are you sure you want to delete "${itemToDelete?.title || 'this page'}" from your library? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
