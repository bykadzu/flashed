/**
 * Sidebar - Icon-only navigation sidebar
 */

import React from 'react';
import {
    HomeIcon,
    FolderIcon,
    HistoryIcon,
    ShareIcon,
    PublishIcon,
    ChartIcon,
    SettingsIcon
} from './Icons';

// Plus icon for New button
const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

interface SidebarProps {
    onHome: () => void;
    onNew: () => void;
    onProjects: () => void;
    onHistory: () => void;
    onShare: () => void;
    onPublish: () => void;
    onAnalytics: () => void;
    onSettings: () => void;
    hasArtifact: boolean;
}

export default function Sidebar({
    onHome,
    onNew,
    onProjects,
    onHistory,
    onShare,
    onPublish,
    onAnalytics,
    onSettings,
    hasArtifact
}: SidebarProps) {
    return (
        <aside className="sidebar">
            {/* Top section */}
            <button
                className="sidebar-btn logo"
                onClick={onHome}
                title="Home"
            >
                ⚡
            </button>

            <button
                className="sidebar-btn"
                onClick={onNew}
                title="New Page"
            >
                <PlusIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onProjects}
                title="Projects"
            >
                <FolderIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onHistory}
                title="History"
            >
                <HistoryIcon />
            </button>

            <div className="sidebar-divider" />

            {/* Middle section - artifact actions */}
            <button
                className={`sidebar-btn ${!hasArtifact ? 'disabled' : ''}`}
                onClick={hasArtifact ? onShare : undefined}
                title={hasArtifact ? "Share" : "Share (generate a page first)"}
                disabled={!hasArtifact}
            >
                <ShareIcon />
            </button>

            <button
                className={`sidebar-btn ${!hasArtifact ? 'disabled' : ''}`}
                onClick={hasArtifact ? onPublish : undefined}
                title={hasArtifact ? "Publish" : "Publish (generate a page first)"}
                disabled={!hasArtifact}
            >
                <PublishIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onAnalytics}
                title="Analytics"
            >
                <ChartIcon />
            </button>

            {/* Spacer pushes settings to bottom */}
            <div className="sidebar-spacer" />

            <div className="sidebar-divider" />

            {/* Bottom section */}
            <button
                className="sidebar-btn"
                onClick={onSettings}
                title="Settings"
            >
                <SettingsIcon />
            </button>
        </aside>
    );
}
