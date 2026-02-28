
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Flashed Utility Functions
 * Common helpers for DOM manipulation, formatting, and data processing
 */

import { nanoid } from 'nanoid';

// Use crypto.randomUUID() - available in modern browsers in secure contexts (HTTPS)

/**
 * Generate a unique ID using cryptographically secure nanoid
 */
export const generateId = (): string => nanoid(12);

/**
 * Format a timestamp (number or Date) to a human-readable string
 * @param timestamp - Unix timestamp in milliseconds or Date object
 * @returns Formatted string like "Jan 15, 2026 at 2:30 PM"
 */
export function formatTimestamp(timestamp: number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Format a timestamp for display in lists (compact form)
 * @param timestamp - Unix timestamp in milliseconds or Date object
 * @returns Formatted string like "Jan 15, 2:30 PM"
 */
export function formatTimestampCompact(timestamp: number | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}

/**
 * Extracts MIME type from a base64 data URL string
 * @param dataUrl - Data URL string (e.g., "data:image/png;base64,...")
 * @returns MIME type string (e.g., "image/png") or fallback to "image/jpeg"
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string {
    const match = dataUrl.match(/^data:([^;]+);base64,/);
    return match?.[1] ?? 'image/jpeg';
}

/**
 * Extracts base64 data and MIME type from a data URL
 * @param dataUrl - Data URL string
 * @returns Object with mimeType and base64 data
 */
export function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
    const mimeType = getMimeTypeFromDataUrl(dataUrl);
    const data = dataUrl.split(',')[1] || '';
    return { mimeType, data };
}

/**
 * Load an image from a URL and return it as an HTMLImageElement
 * Useful for preloading images before displaying them
 */
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  });

/**
 * Creates a debounced version of a function
 * Delays execution until after 'wait' milliseconds have elapsed since the last call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Creates a throttled version of a function
 * Ensures the function is called at most once every 'wait' milliseconds
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: unknown, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Validates an email address format
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates a URL format
 * @param url - URL string to validate
 * @returns true if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a URL is from a trusted origin (prevent open redirects)
 * @param url - URL to check
 * @param trustedOrigins - Array of trusted origins (default: current window origin)
 * @returns true if URL is safe
 */
export function isTrustedUrl(url: string, trustedOrigins: string[] = []): boolean {
  try {
    const urlObj = new URL(url);
    const defaultTrusted = typeof window !== 'undefined' ? [window.location.origin] : [];
    const allTrusted = [...defaultTrusted, ...trustedOrigins];
    return allTrusted.includes(urlObj.origin);
  } catch {
    return false;
  }
}

/**
 * Generates a random string of specified length
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Converts a string to a URL-friendly slug
 * @param text - Text to slugify
 * @returns Slugified string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncates a string to a maximum length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length (default 100)
 * @returns Truncated string
 */
export function truncate(text: string, maxLength = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Deep clones an object using structuredClone (with fallback)
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  
  // If no rotation, use simpler path
  if (rotation === 0) {
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    
    ctx.drawImage(
      image,
      pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
      0, 0, pixelCrop.width, pixelCrop.height
    );
    return canvas.toDataURL('image/jpeg');
  }

  // Handle rotation
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.width * cos + image.height * sin;
  const rotatedHeight = image.width * sin + image.height * cos;

  const canvas = document.createElement('canvas');
  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Transform: translate to center, rotate, draw image centered
  ctx.translate(rotatedWidth / 2, rotatedHeight / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);

  // Extract cropped area from rotated canvas
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // Create final canvas with crop dimensions
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = pixelCrop.width;
  finalCanvas.height = pixelCrop.height;
  const finalCtx = finalCanvas.getContext('2d');
  if (!finalCtx) return '';

  finalCtx.putImageData(data, 0, 0);
  return finalCanvas.toDataURL('image/jpeg');
}

/**
 * Safe localStorage get with JSON parsing
 */
export function storageGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safe localStorage set with JSON stringify
 */
export function storageSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe localStorage remove
 */
export function storageRemove(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/**
 * Generate a UUID v4 using the Web Crypto API
 */
export function uuidv4(): string {
    // crypto.randomUUID() is available in secure contexts (HTTPS)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback: RFC4122 v4 compliant UUID using Math.random
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Format a number as currency
 * @param amount - Number to format
 * @param currency - Currency code (default: USD)
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    // Fallback for invalid locale/currency
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats a timestamp as a relative time string (e.g., "2 hours ago", "yesterday")
 * @param timestamp - Unix timestamp in milliseconds or Date object
 * @param locale - Locale for formatting (default: 'en')
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number | Date, locale: string = 'en'): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffWeek = Math.floor(diffDay / 7);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    // Future dates - show as "in X time"
    if (diffMs < 0) {
        const absDiffMin = Math.abs(diffMin);
        const absDiffHour = Math.abs(diffHour);
        const absDiffDay = Math.abs(diffDay);
        
        if (absDiffMin < 60) return 'in a minute';
        if (absDiffHour < 24) return `in ${absDiffHour} hour${absDiffHour > 1 ? 's' : ''}`;
        if (absDiffDay < 7) return `in ${absDiffDay} day${absDiffDay > 1 ? 's' : ''}`;
        return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    }

    // Past dates
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay === 1) return 'yesterday';
    if (diffDay < 7) return `${diffDay} days ago`;
    if (diffWeek === 1) return 'last week';
    if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
    if (diffYear === 1) return 'last year';
    return `${diffYear} years ago`;
}
