/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { KeyboardShortcut } from '../types';
import { XIcon } from './Icons';

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_LABELS: Record<KeyboardShortcut['category'], string> = {
    navigation: 'Navigation',
    actions: 'Actions',
    generation: 'Generation',
    editing: 'Editing',
};

const SHORTCUTS: KeyboardShortcut[] = [
    // Navigation
    { key: 'Escape', modifiers: [], action: 'close', description: 'Close modals / go back', category: 'navigation' },
    { key: 'ArrowLeft', modifiers: [], action: 'prevVariant', description: 'Previous variant', category: 'navigation' },
    { key: 'ArrowRight', modifiers: [], action: 'nextVariant', description: 'Next variant', category: 'navigation' },

    // Actions
    { key: '?', modifiers: ['ctrl'], action: 'help', description: 'Show keyboard shortcuts', category: 'actions' },
    { key: 'S', modifiers: ['ctrl'], action: 'save', description: 'Save to library', category: 'actions' },
    { key: 'E', modifiers: ['ctrl'], action: 'export', description: 'Export', category: 'actions' },
    { key: 'P', modifiers: ['ctrl'], action: 'publish', description: 'Publish', category: 'actions' },
    { key: 'D', modifiers: ['ctrl'], action: 'download', description: 'Download', category: 'actions' },

    // Generation
    { key: 'Enter', modifiers: [], action: 'generate', description: 'Generate', category: 'generation' },
    { key: 'Enter', modifiers: ['ctrl'], action: 'generateMore', description: 'Generate more variants', category: 'generation' },
    { key: 'R', modifiers: ['ctrl'], action: 'refine', description: 'Focus refine input', category: 'generation' },

    // Editing
    { key: 'Z', modifiers: ['ctrl'], action: 'undo', description: 'Undo', category: 'editing' },
    { key: 'Z', modifiers: ['ctrl', 'shift'], action: 'redo', description: 'Redo', category: 'editing' },
];

const CATEGORY_ORDER: KeyboardShortcut['category'][] = ['navigation', 'actions', 'generation', 'editing'];

function formatKeyDisplay(key: string): string {
    const keyMap: Record<string, string> = {
        'ArrowLeft': '\u2190',
        'ArrowRight': '\u2192',
        'ArrowUp': '\u2191',
        'ArrowDown': '\u2193',
        'Escape': 'Esc',
        'Enter': 'Enter',
    };
    return keyMap[key] || key;
}

function formatModifier(mod: string): string {
    const modMap: Record<string, string> = {
        ctrl: 'Ctrl',
        meta: 'Cmd',
        shift: 'Shift',
        alt: 'Alt',
    };
    return modMap[mod] || mod;
}

function ShortcutKeys({ shortcut }: { shortcut: KeyboardShortcut }) {
    const parts: string[] = [
        ...shortcut.modifiers.map(formatModifier),
        formatKeyDisplay(shortcut.key),
    ];

    return (
        <span className="shortcut-keys">
            {parts.map((part, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span className="shortcut-separator">+</span>}
                    <kbd className="shortcut-kbd">{part}</kbd>
                </React.Fragment>
            ))}
        </span>
    );
}

export default function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
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

    if (!isOpen) return null;

    const shortcutsByCategory = CATEGORY_ORDER.map(category => ({
        category,
        label: CATEGORY_LABELS[category],
        shortcuts: SHORTCUTS.filter(s => s.category === category),
    }));

    return (
        <div className="shortcuts-modal-overlay" onClick={onClose}>
            <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
                <div className="shortcuts-modal-header">
                    <h2>Keyboard Shortcuts</h2>
                    <button className="shortcuts-close-btn" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>
                <div className="shortcuts-modal-body">
                    {shortcutsByCategory.map(({ category, label, shortcuts }) => (
                        <div key={category} className="shortcuts-category">
                            <h3 className="shortcuts-category-label">{label}</h3>
                            <div className="shortcuts-grid">
                                {shortcuts.map((shortcut, i) => (
                                    <div key={i} className="shortcut-row">
                                        <span className="shortcut-description">{shortcut.description}</span>
                                        <ShortcutKeys shortcut={shortcut} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
