/**
 * HTML Library storage utilities
 */

import { nanoid } from 'nanoid';
import { HTMLItem } from '../types';

const STORAGE_KEY = 'flashed_library_v1';
const MAX_LIBRARY_ITEMS = 50;
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
    // Enforce item count limit to prevent localStorage exceeded errors
    const limited = updated.slice(0, MAX_LIBRARY_ITEMS);
    try {
        // Pre-check storage space
        const itemSize = item.size || new Blob([item.content]).size;
        if (!hasStorageSpace(itemSize)) {
            throw new Error("Storage quota exceeded. Try deleting old items.");
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
        return limited;
    } catch (e) {
        console.error("Storage quota exceeded", e);
        throw new Error("Storage quota exceeded. Try deleting old items.");
    }
};

export const deleteItem = (id: string): HTMLItem[] => {
    const current = getLibrary();
    const updated = current.filter(i => i.id !== id);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error("Failed to delete item", e);
        return current; // Return current state on error instead of empty array
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
        // Return original on error
        return getLibrary();
    }
};

/**
 * Create a library item object without saving to storage
 */
export const createLibraryItem = (
    content: string,
    description: string = '',
    title: string = '',
    tags: string[] = []
): HTMLItem => {
    const size = new Blob([content]).size;
    return {
        id: nanoid(),
        content,
        title: title || `Item ${new Date().toLocaleDateString()}`,
        description,
        tags,
        size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
};
