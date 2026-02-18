/**
 * Type declarations for Babel Standalone (loaded at runtime)
 */

export interface BabelTransformResult {
    code: string;
    map?: unknown;
    ast?: unknown;
}

export interface BabelCore {
    transform(
        code: string,
        options: BabelTransformOptions
    ): BabelTransformResult;
}

export interface BabelTransformOptions {
    presets?: string[];
    plugins?: unknown[];
    filename?: string;
    sourceType?: 'module' | 'script';
}

export interface BabelWindow {
    Babel: BabelCore;
}

declare global {
    interface Window extends BabelWindow {}
}

export {};
