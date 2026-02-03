export interface HTMLItem {
  id: string;
  title: string;
  description?: string;
  content: string; // The raw HTML content
  createdAt: number;
  tags: string[];
  isTrusted: boolean; // If true, allows scripts
  size: number;
}

export type SortOption = 'newest' | 'oldest' | 'name' | 'size';

export interface ViewportSize {
  width: string;
  height: string;
  label: string;
  icon: 'smartphone' | 'monitor' | 'tablet';
}

export const VIEWPORTS: ViewportSize[] = [
  { width: '100%', height: '100%', label: 'Desktop', icon: 'monitor' },
  { width: '768px', height: '100%', label: 'Tablet', icon: 'tablet' },
  { width: '375px', height: '100%', label: 'Mobile', icon: 'smartphone' },
];