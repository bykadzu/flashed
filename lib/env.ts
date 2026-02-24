/**
 * Centralized environment variable access and validation
 *
 * All env vars should be accessed through this module for:
 * - Type safety
 * - Validation on startup
 * - Single source of truth
 */

// Environment variables - accessed via Vite's import.meta.env or injected via define
export const ENV = {
    // API Keys
    OPENROUTER_API_KEY: import.meta.env.VITE_OPENROUTER_API_KEY || '',

    // Supabase
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',

    // Clerk
    CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',

    // Unsplash
    UNSPLASH_ACCESS_KEY: import.meta.env.VITE_UNSPLASH_ACCESS_KEY || '',

    // App Config
    PUBLIC_URL: import.meta.env.VITE_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
} as const;

// Required env vars - app won't function without these
const REQUIRED_ENV_VARS = ['OPENROUTER_API_KEY'] as const;

// Optional but recommended - features will be limited without these
const RECOMMENDED_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'CLERK_PUBLISHABLE_KEY', 'UNSPLASH_ACCESS_KEY'] as const;

export interface EnvValidationResult {
    valid: boolean;
    missing: string[];
    warnings: string[];
}

/**
 * Validates that required environment variables are set
 * Call this on app startup to catch configuration issues early
 */
export function validateEnv(): EnvValidationResult {
    const missing: string[] = [];
    const warnings: string[] = [];

    // Check required vars
    for (const key of REQUIRED_ENV_VARS) {
        if (!ENV[key]) {
            missing.push(key);
        }
    }

    // Check recommended vars
    for (const key of RECOMMENDED_ENV_VARS) {
        if (!ENV[key]) {
            warnings.push(key);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings
    };
}

/**
 * Get the OpenRouter API key
 * Throws an error if not configured (use validateEnv() on startup to catch this early)
 */
export function getApiKey(): string {
    const key = ENV.OPENROUTER_API_KEY;
    if (!key) {
        throw new Error(
            'OpenRouter API key not configured. ' +
            'Please set OPENROUTER_API_KEY in your .env file. ' +
            'Get your key at https://openrouter.ai/keys'
        );
    }
    return key;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
    return !!(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY);
}

/**
 * Check if Clerk auth is configured
 */
export function isClerkConfigured(): boolean {
    return !!ENV.CLERK_PUBLISHABLE_KEY;
}

/**
 * Check if Unsplash image integration is configured
 */
export function isUnsplashConfigured(): boolean {
    return !!ENV.UNSPLASH_ACCESS_KEY;
}
