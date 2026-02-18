/**
 * Type declarations for Babel Standalone (loaded at runtime)
 */

interface BabelTransformResult {
    code: string;
    map?: unknown;
    ast?: unknown;
}

interface BabelCore {
    transform(
        code: string,
        options: BabelTransformOptions
    ): BabelTransformResult;
}

interface BabelTransformOptions {
    presets?: string[];
    plugins?: unknown[];
    filename?: string;
    sourceType?: 'module' | 'script';
}

interface BabelWindow {
    Babel: BabelCore;
}

declare global {
    interface Window extends BabelWindow {}
}
