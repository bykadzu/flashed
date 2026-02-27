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
    try {
        const current = getLibrary();
        const updated = current.filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to delete item", e);
        return [];
    }
};

export const updateItem = (id: string, updates: Partial<HTMLItem>): HTMLItem[] => {
    try {
        const current = getLibrary();
        const updated = current.map(item => item.id === id ? { ...item, ...updates } : item);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to update item", e);
        return [];
    }
};

/**
 * Extracts metadata from a raw HTML string.
 */
export const extractMetadata = (html: string) => {
    // Return safe defaults if input is invalid
    if (!html || typeof html !== 'string') {
        return { title: 'Untitled Document', description: '', ogImage: undefined };
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Title: prefer <title>, then first <h1>, then og:title, then fallback
        const title = 
            doc.querySelector('title')?.textContent?.trim() ||
            doc.querySelector('h1')?.textContent?.trim() ||
            doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
            'Untitled Document';
        
        // Description: prefer meta description, then og:description
        const description = 
            doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
            doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            '';
        
        // Optional: extract og:image for thumbnail
        const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;

        return { title, description, ogImage };
    } catch (e) {
        console.error("Failed to extract metadata from HTML:", e);
        return { title: 'Untitled Document', description: '', ogImage: undefined };
    }
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
        id: crypto.randomUUID(),
        title: title || metadata.title || prompt.slice(0, 50),
        description: metadata.description || prompt,
        content: html,
        createdAt: Date.now(),
        tags,
        size: new Blob([html]).size,
        prompt
    };
};
