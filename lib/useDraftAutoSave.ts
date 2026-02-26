/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

import { Draft } from '../types';

const STORAGE_KEY = 'flashed_draft_v1';
const AUTO_SAVE_INTERVAL_MS = 30_000;

export interface UseDraftAutoSaveResult {
    saveDraft: (draft: Omit<Draft, 'id' | 'timestamp'>) => void;
    loadDraft: () => Draft | null;
    clearDraft: () => void;
    hasDraft: boolean;
}

/**
 * Generates a simple unique identifier for draft entries.
 */
function generateDraftId(): string {
    return `draft_${Date.now()}_${nanoid(9)}`;
}

/**
 * Reads the stored draft from localStorage, returning it if valid or null otherwise.
 */
function readDraftFromStorage(): Draft | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return null;
        }
        const parsed = JSON.parse(stored) as Draft;
        if (parsed && parsed.id && parsed.prompt) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Custom hook that auto-saves draft state to localStorage.
 *
 * On mount, the hook checks localStorage for an existing draft and sets
 * `hasDraft` accordingly, enabling a draft recovery prompt in the UI.
 * While a draft is held in memory, it is automatically persisted every
 * 30 seconds (debounced). The caller can also trigger an immediate save
 * via `saveDraft`.
 *
 * @returns An object with saveDraft, loadDraft, clearDraft, and hasDraft.
 */
export function useDraftAutoSave(): UseDraftAutoSaveResult {
    const [hasDraft, setHasDraft] = useState<boolean>(false);
    const pendingDraftRef = useRef<Omit<Draft, 'id' | 'timestamp'> | null>(null);
    const lastSavedRef = useRef<string>(''); // Track last saved content to avoid redundant saves
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Check for existing draft on mount and set hasDraft for recovery prompt
    useEffect(() => {
        const existing = readDraftFromStorage();
        if (existing) {
            setHasDraft(true);
        }
    }, []);

    /**
     * Persist the given draft data to localStorage immediately.
     */
    const saveDraft = useCallback((draft: Omit<Draft, 'id' | 'timestamp'>) => {
        try {
            const fullDraft: Draft = {
                ...draft,
                id: generateDraftId(),
                timestamp: Date.now(),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullDraft));
            setHasDraft(true);
            pendingDraftRef.current = draft;
            // Track content hash to detect changes
            lastSavedRef.current = JSON.stringify(draft);
        } catch {
            // localStorage may be full or unavailable; fail silently
        }
    }, []);

    /**
     * Load the most recently saved draft from localStorage.
     */
    const loadDraft = useCallback((): Draft | null => {
        return readDraftFromStorage();
    }, []);

    /**
     * Clear the saved draft from localStorage.
     */
    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore errors during removal
        }
        setHasDraft(false);
        pendingDraftRef.current = null;
        lastSavedRef.current = '';
    }, []);

    // Set up debounced auto-save interval
    useEffect(() => {
        timerRef.current = setInterval(() => {
            if (pendingDraftRef.current) {
                const currentContent = JSON.stringify(pendingDraftRef.current);
                // Skip if content hasn't changed since last save
                if (currentContent === lastSavedRef.current) {
                    return;
                }
                try {
                    const fullDraft: Draft = {
                        ...pendingDraftRef.current,
                        id: generateDraftId(),
                        timestamp: Date.now(),
                    };
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullDraft));
                    setHasDraft(true);
                    lastSavedRef.current = currentContent;
                } catch {
                    // localStorage may be full or unavailable; fail silently
                }
            }
        }, AUTO_SAVE_INTERVAL_MS);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    return {
        saveDraft,
        loadDraft,
        clearDraft,
        hasDraft,
    };
}
