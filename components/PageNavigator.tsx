/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { SitePage } from '../types';
import { HomeIcon } from './Icons';

interface PageNavigatorProps {
    pages: SitePage[];
    currentPageId: string;
    onPageSelect: (pageId: string) => void;
    onAddPage?: () => void;
    compact?: boolean;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({
    pages,
    currentPageId,
    onPageSelect,
    onAddPage,
    compact = false
}) => {
    if (compact) {
        return (
            <div className="page-navigator-compact">
                <select 
                    value={currentPageId}
                    onChange={(e) => onPageSelect(e.target.value)}
                    className="page-select"
                >
                    {pages.map(page => (
                        <option key={page.id} value={page.id}>
                            {page.isHome ? '~ ' : ''}{page.name}
                        </option>
                    ))}
                </select>
                {onAddPage && (
                    <button 
                        className="add-page-btn-compact"
                        onClick={onAddPage}
                        title="Add Page"
                    >
                        +
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="page-navigator">
            <div className="page-tabs">
                {pages.map(page => (
                    <button
                        key={page.id}
                        className={`page-tab ${currentPageId === page.id ? 'active' : ''} ${page.status === 'streaming' ? 'streaming' : ''}`}
                        onClick={() => onPageSelect(page.id)}
                    >
                        {page.isHome && <span className="home-icon"><HomeIcon /></span>}
                        <span className="page-name">{page.name}</span>
                        {page.status === 'streaming' && <span className="status-dot"></span>}
                    </button>
                ))}
                {onAddPage && (
                    <button 
                        className="page-tab add-page-tab"
                        onClick={onAddPage}
                        title="Add Page"
                    >
                        <span className="plus-icon">+</span>
                        <span className="add-text">Add Page</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default PageNavigator;
