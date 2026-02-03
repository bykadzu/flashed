import { HTMLItem } from '../types';

const STORAGE_KEY = 'lumina_library_v1';

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
    alert("Failed to save: Storage quota exceeded. Try deleting old items.");
    return current;
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