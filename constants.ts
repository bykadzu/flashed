
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// UI Timing
export const TOAST_DURATION_DEFAULT = 3000;
export const TOAST_DURATION_ERROR = 6000;
export const COPY_FEEDBACK_DURATION = 2000;
export const FOCUS_DELAY = 100;
export const PLACEHOLDER_FETCH_DELAY = 1000;
export const PLACEHOLDER_CYCLE_INTERVAL = 3000;

// API Configuration
export const DEFAULT_FETCH_TIMEOUT_MS = 30000; // 30 seconds

// Content Limits
export const HTML_PREVIEW_MAX_LENGTH = 12000;

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
    // Tech & SaaS
    "Landing page for an AI agent automation platform",
    "Series A fintech dashboard waiting list",
    "SaaS pricing page with glassmorphism effects",
    "Modern health-tech app launch page",
    "Cybersecurity enterprise solution homepage",
    "API developer documentation portal",
    "Mobile app landing page with app store badges",
    
    // Business & Professional
    "Minimalist portfolio for a senior product designer",
    "Professional law firm with case results",
    "Premium physiotherapy practice in Zurich",
    "Consulting firm specializing in digital transformation",
    "Executive coaching services landing page",
    
    // Creative & Lifestyle
    "Elegant wedding planner portfolio with gallery",
    "Boutique hair salon with online booking",
    "Contemporary architecture firm portfolio",
    "Luxury spa with package deals",
    "Cozy coffee shop with loyalty program",
    "Modern dental clinic with smile gallery",
    "Personal fitness trainer landing page",
    "Vintage record store with online shop",
    
    // Real Estate & Hospitality
    "Luxury real estate agency in Los Angeles",
    "Boutique hotel in Tuscany with booking",
    "Vacation rental property showcase",
    "Interior design studio portfolio",
    
    // More unique niches
    "Sustainable fashion brand launch",
    "Plant nursery e-commerce homepage",
    "Pet grooming salon with services",
    "Language learning app landing"
];
