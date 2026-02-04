/**
 * HTML Library storage utilities
 */

import { HTMLItem } from '../types';

const STORAGE_KEY = 'flashed_library_v1';

export const getLibrary = (): HTMLItem[] => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Failed to load library", e);
        return [];
    }
};

export const saveItem = (item: HTMLItem): HTMLItem[] => {
    const current = getLibrary();
    const updated = [item, ...current];
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Storage quota exceeded", e);
        throw new Error("Storage quota exceeded. Try deleting old items.");
    }
};

export const deleteItem = (id: string): HTMLItem[] => {
    const current = getLibrary();
    const updated = current.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
};

export const updateItem = (id: string, updates: Partial<HTMLItem>): HTMLItem[] => {
    const current = getLibrary();
    const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
};

/**
 * Extracts metadata from a raw HTML string.
 */
export const extractMetadata = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent || 'Untitled Document';
    const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';

    return { title, description };
};

/**
 * Creates an HTMLItem from an artifact
 */
export const createLibraryItem = (
    html: string,
    prompt: string,
    title?: string,
    tags: string[] = []
): HTMLItem => {
    const metadata = extractMetadata(html);
    return {
        id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
        title: title || metadata.title || prompt.slice(0, 50),
        description: metadata.description || prompt,
        content: html,
        createdAt: Date.now(),
        tags,
        size: new Blob([html]).size,
        prompt
    };
};
