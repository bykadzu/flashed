/**
 * JSX/TSX to HTML compiler using Babel Standalone
 * Dynamically loads Babel to avoid bloating the initial bundle.
 */

import type { BabelTransformOptions } from '../types/babel';

let babelLoaded = false;

export class JSXCompilationError extends Error {
    constructor(message: string, public readonly cause?: Error) {
        super(message);
        this.name = 'JSXCompilationError';
    }
}

export async function compileJSX(source: string, filename: string): Promise<string> {
    if (!source || !source.trim()) {
        throw new JSXCompilationError('Source code is empty');
    }

    try {
        if (!babelLoaded) {
            await loadBabelStandalone();
            babelLoaded = true;
        }

        if (!window.Babel) {
            throw new JSXCompilationError('Babel not available after loading');
        }

        const options: BabelTransformOptions = {
            presets: ['react', 'typescript'],
            filename,
        };

        const compiled = window.Babel.transform(source, options);

        if (!compiled?.code) {
            throw new JSXCompilationError('Babel returned empty output');
        }

        return wrapInHTML(compiled.code, filename);
    } catch (err) {
        if (err instanceof JSXCompilationError) {
            throw err;
        }
        throw new JSXCompilationError(
            `Failed to compile ${filename}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            err instanceof Error ? err : undefined
        );
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function wrapInHTML(jsCode: string, title: string): string {
    const safeName = escapeHtml(title.replace(/\.[jt]sx?$/i, ''));
    // Prevent </script> injection attacks by escaping closing script tags
    const safeJsCode = jsCode.replace(/<\/script/gi, '<\\/script');
    return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeName}</title>
<script src="https://unpkg.com/react@19/umd/react.production.min.js"><\/script>
<script src="https://unpkg.com/react-dom@19/umd/react-dom.production.min.js"><\/script>
</head><body>
<div id="root"></div>
<script>
${safeJsCode}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
<\/script>
</body></html>`;
}

async function loadBabelStandalone(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (window.Babel) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Babel Standalone'));
        document.head.appendChild(script);
    });
}
