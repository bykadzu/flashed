/**
 * HTMLLibrary - Visual library of saved HTML pages
 */

import React, { useState, useEffect, useMemo } from 'react';
import { HTMLItem, LibrarySortOption } from '../types';
import * as library from '../lib/htmlLibrary';
import { XIcon, DownloadIcon, SearchIcon, TrashIcon, LayersIcon } from './Icons';
import ConfirmModal from './ConfirmModal';

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
    const [itemToDelete, setItemToDelete] = useState<HTMLItem | null>(null);

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
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

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
