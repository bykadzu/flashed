/**
 * HTMLLibrary - Visual library of saved HTML pages
 */

import React, { useState, useEffect, useMemo } from 'react';
import { HTMLItem, LibrarySortOption } from '../types';
import * as library from '../lib/htmlLibrary';
import { XIcon, DownloadIcon } from './Icons';

// Search icon
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

// Trash icon
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);

// Layers icon for empty state
const LayersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
    </svg>
);

interface HTMLLibraryProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem?: (item: HTMLItem) => void;
}

export default function HTMLLibrary({ isOpen, onClose, onSelectItem }: HTMLLibraryProps) {
    const [items, setItems] = useState<HTMLItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOption, setSortOption] = useState<LibrarySortOption>('newest');
    const [selectedItem, setSelectedItem] = useState<HTMLItem | null>(null);

    // Load library on open
    useEffect(() => {
        if (isOpen) {
            setItems(library.getLibrary());
        }
    }, [isOpen]);

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

    const handleDelete = (id: string) => {
        if (confirm('Delete this page from library?')) {
            const updated = library.deleteItem(id);
            setItems(updated);
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
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
            <div className="library-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="library-header">
                    <div>
                        <h2>Your Library</h2>
                        <p className="library-subtitle">{items.length} saved pages</p>
                    </div>
                    <button className="close-button" onClick={onClose}>
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
                    <select
                        value={sortOption}
                        onChange={(e) => setSortOption(e.target.value as LibrarySortOption)}
                        className="library-sort"
                    >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name">Name</option>
                        <option value="size">Size</option>
                    </select>
                </div>

                {/* Content */}
                <div className="library-content">
                    {filteredItems.length === 0 ? (
                        <div className="library-empty">
                            <LayersIcon />
                            <h3>Library is empty</h3>
                            <p>Generate a page and click "Save to Library" to add it here.</p>
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
                                        >
                                            <DownloadIcon />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            title="Delete"
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
                                            onSelectItem(selectedItem);
                                            onClose();
                                        }}
                                    >
                                        Use This Page
                                    </button>
                                )}
                            </div>
                        </div>
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
        </div>
    );
}
