
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
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // Calculate new dimensions after rotation
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const newWidth = image.width * cos + image.height * sin;
  const newHeight = image.width * sin + image.height * cos;

  // Set canvas size to match rotated image
  canvas.width = newWidth;
  canvas.height = newHeight;

  // Move origin to center for rotation
  ctx.translate(newWidth / 2, newHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Extract cropped image
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

  if (!finalCtx) {
    return '';
  }

  finalCtx.putImageData(data, 0, 0);

  // Return as Base64 string
  return finalCanvas.toDataURL('image/jpeg');
}
