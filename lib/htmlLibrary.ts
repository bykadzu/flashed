/**
 * HTML Library storage utilities
 */

import { nanoid } from 'nanoid';
import { HTMLItem } from '../types';

const STORAGE_KEY = 'flashed_library_v1';
const MAX_STORAGE_MB = 5; // Approximate localStorage limit

/**
 * Estimate available localStorage space in bytes
 */
export const getAvailableStorage = (): number => {
    try {
        const current = getLibrary();
        const currentSize = current.reduce((sum, item) => sum + (item.size || 0), 0);
        const maxBytes = MAX_STORAGE_MB * 1024 * 1024;
        return Math.max(0, maxBytes - currentSize);
    } catch {
        return 0;
    }
};

/**
 * Check if there's enough space to save an item
 */
export const hasStorageSpace = (itemSize: number): boolean => {
    return getAvailableStorage() > itemSize * 1.2; // 20% buffer
};

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
        // Pre-check storage space
        const itemSize = item.size || new Blob([item.content]).size;
        if (!hasStorageSpace(itemSize)) {
            throw new Error("Storage quota exceeded. Try deleting old items.");
        }
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
        id: nanoid(),
        title: title || metadata.title || prompt.slice(0, 50),
        description: metadata.description || prompt,
        content: html,
        createdAt: Date.now(),
        tags,
        size: new Blob([html]).size,
        prompt
    };
};
