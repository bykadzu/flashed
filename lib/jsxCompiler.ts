/**
 * JSX/TSX to HTML compiler using Babel Standalone
 * Dynamically loads Babel to avoid bloating the initial bundle.
 */

let babelLoaded = false;

export async function compileJSX(source: string, filename: string): Promise<string> {
    if (!babelLoaded) {
        await loadBabelStandalone();
        babelLoaded = true;
    }

    const compiled = (window as any).Babel.transform(source, {
        presets: ['react', 'typescript'],
        filename
    }).code;

    return wrapInHTML(compiled, filename);
}

function wrapInHTML(jsCode: string, title: string): string {
    const safeName = title.replace(/\.[jt]sx?$/i, '');
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
${jsCode}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
<\/script>
</body></html>`;
}

async function loadBabelStandalone(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if ((window as any).Babel) {
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
