/**
 * Extracts metadata from a raw HTML string.
 */
export const extractMetadata = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Title: prefer <title>, then first <h1>, then og:title, then fallback
  const title = 
    doc.querySelector('title')?.textContent?.trim() ||
    doc.querySelector('h1')?.textContent?.trim() ||
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    'Untitled Document';
  
  // Description: prefer meta description, then og:description
  const description = 
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    '';
  
  // Optional: extract og:image for thumbnail
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || undefined;
  
  // Basic favicon extraction (naive)
  const favicon = doc.querySelector('link[rel="icon"]')?.getAttribute('href') || 
                  doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href') || '';

  return { title, description, ogImage, favicon };
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