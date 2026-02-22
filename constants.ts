
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Locale for date/time formatting (uses browser default if not set)
export const LOCALE = 'en-US';

// UI Timing Constants (in milliseconds)
export const TOAST_DURATION_DEFAULT = 3000;
export const TOAST_DURATION_ERROR = 6000;
export const COPY_FEEDBACK_DURATION = 2000;
export const FOCUS_DELAY = 100;
export const PLACEHOLDER_FETCH_DELAY = 1000;
export const PLACEHOLDER_CYCLE_INTERVAL = 3000;

// Content Limits
export const HTML_PREVIEW_MAX_LENGTH = 8000;

// Multi-variant generation
export const GENERATION_BATCH_SIZE = 3;
export const VARIANT_OPTIONS = [3, 5, 10] as const;
export const STYLE_FALLBACKS = [
    "Modern Clean",
    "Bold & Vibrant",
    "Professional Minimal",
    "Elegant Serif",
    "Playful Colorful",
    "Dark Mode Luxe",
    "Retro Vintage",
    "Soft Pastel",
    "High-Contrast Corporate",
    "Warm Natural"
];

// Responsive Breakpoints (in pixels)
export const MOBILE_BREAKPOINT = 1024;

// Time Constants
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const INITIAL_PLACEHOLDERS = [
    "Landing page for an AI agent automation platform",
    "Series A fintech dashboard waiting list",
    "Luxury real estate agency in Los Angeles",
    "Cybersecurity enterprise solution homepage",
    "Minimalist portfolio for a senior product designer",
    "SaaS pricing page with glassmorphism effects",
    "Modern health-tech app launch page",
    "Elegant wedding planner portfolio with gallery",
    "Premium physiotherapy practice in Zurich",
    "Modern dental clinic with smile gallery",
    "Boutique hair salon with online booking",
    "Professional law firm with case results",
    "Cozy coffee shop with loyalty program",
    "Contemporary architecture firm portfolio",
    "Luxury spa with package deals"
];
