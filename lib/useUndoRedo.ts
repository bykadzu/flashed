/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef } from 'react';

export interface UndoRedoEntry {
    html: string;
    label?: string;
    timestamp: number;
}

export interface UseUndoRedoResult {
    pushState: (html: string, label?: string) => void;
    undo: () => UndoRedoEntry | null;
    redo: () => UndoRedoEntry | null;
    canUndo: boolean;
    canRedo: boolean;
    currentState: { html: string; label?: string } | null;
}

/**
 * Custom hook for undo/redo functionality that tracks HTML state changes.
 */
export function useUndoRedo(maxHistory: number = 50): UseUndoRedoResult {
    const pastRef = useRef<UndoRedoEntry[]>([]);
    const futureRef = useRef<UndoRedoEntry[]>([]);
    const currentRef = useRef<UndoRedoEntry | null>(null);
    const [, forceUpdate] = useState(0);

    const pushState = useCallback((html: string, label?: string) => {
        const entry: UndoRedoEntry = { html, label, timestamp: Date.now() };

        if (currentRef.current) {
            pastRef.current = [...pastRef.current, currentRef.current];
            if (pastRef.current.length > maxHistory) {
                pastRef.current = pastRef.current.slice(-maxHistory);
            }
        }
        currentRef.current = entry;
        futureRef.current = [];
        forceUpdate(n => n + 1);
    }, [maxHistory]);

    const undo = useCallback((): UndoRedoEntry | null => {
        if (pastRef.current.length === 0) return null;

        const newPast = [...pastRef.current];
        const previous = newPast.pop()!;

        if (currentRef.current) {
            futureRef.current = [currentRef.current, ...futureRef.current];
        }
        currentRef.current = previous;
        pastRef.current = newPast;
        forceUpdate(n => n + 1);
        return previous;
    }, []);

    const redo = useCallback((): UndoRedoEntry | null => {
        if (futureRef.current.length === 0) return null;

        const newFuture = [...futureRef.current];
        const next = newFuture.shift()!;

        if (currentRef.current) {
            pastRef.current = [...pastRef.current, currentRef.current];
        }
        currentRef.current = next;
        futureRef.current = newFuture;
        forceUpdate(n => n + 1);
        return next;
    }, []);

    const canUndo = pastRef.current.length > 0;
    const canRedo = futureRef.current.length > 0;

    const currentState = currentRef.current
        ? { html: currentRef.current.html, label: currentRef.current.label }
        : null;

    return { pushState, undo, redo, canUndo, canRedo, currentState };
}
