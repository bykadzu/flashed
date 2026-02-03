/**
 * Extracts metadata from a raw HTML string.
 */
export const extractMetadata = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const title = doc.querySelector('title')?.textContent || 'Untitled Document';
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
  
  // Basic favicon extraction (naive)
  const favicon = doc.querySelector('link[rel="icon"]')?.getAttribute('href') || 
                  doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || '';

  return { title, description, favicon };
};

/**
 * Injects security headers and policies into the HTML string for preview.
 */
export const prepareSafeHTML = (html: string, isTrusted: boolean) => {
  if (isTrusted) {
    return html;
  }

  // Inject a strict Content Security Policy for untrusted files
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data: blob:; script-src 'none'; object-src 'none'; base-uri 'none';">`;
  
  // Try to insert after head, or at the start if no head
  if (html.toLowerCase().includes('<head>')) {
    return html.replace(/<head>/i, `<head>${cspMeta}`);
  } else {
    return `${cspMeta}${html}`;
  }
};

/**
 * Generates a unique ID
 */
export const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);