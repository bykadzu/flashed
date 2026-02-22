/**
 * Sidebar - Icon-only navigation sidebar
 */

import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { isClerkConfigured } from '../lib/env';
import {
    
    FolderIcon,
    HistoryIcon,
    ShareIcon,
    PublishIcon,
    ChartIcon,
    SettingsIcon,
    PlusIcon
} from './Icons';

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
        <aside className="sidebar" role="navigation" aria-label="Main navigation">
            {/* Top section */}
            <button
                className="sidebar-btn logo"
                onClick={onHome}
                title="Home"
                aria-label="Home"
            >
                ⚡
            </button>

            <button
                className="sidebar-btn"
                onClick={onNew}
                title="New Page"
                aria-label="New Page"
            >
                <PlusIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onProjects}
                title="Library"
                aria-label="Library"
            >
                <FolderIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onHistory}
                title="History"
                aria-label="History"
            >
                <HistoryIcon />
            </button>

            <div className="sidebar-divider" />

            {/* Middle section - artifact actions */}
            <button
                className="sidebar-btn"
                onClick={onShare}
                title={hasArtifact ? "Share" : "Share (generate a page first)"}
                disabled={!hasArtifact}
                aria-label="Share"
            >
                <ShareIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onPublish}
                title={hasArtifact ? "Publish" : "Publish (generate a page first)"}
                disabled={!hasArtifact}
                aria-label="Publish"
            >
                <PublishIcon />
            </button>

            <button
                className="sidebar-btn"
                onClick={onAnalytics}
                title="Analytics"
                aria-label="Analytics"
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
                aria-label="Settings"
            >
                <SettingsIcon />
            </button>

            {/* User profile - only show when Clerk is configured */}
            {isClerkConfigured() && (
                <div className="sidebar-user">
                    <UserButton
                        appearance={{
                            elements: {
                                avatarBox: { width: 32, height: 32 }
                            }
                        }}
                    />
                </div>
            )}
        </aside>
    );
}
