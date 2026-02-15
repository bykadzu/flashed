
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

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

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  });

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
