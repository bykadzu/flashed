
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

  // set canvas size to match the bounding box
  canvas.width = image.width;
  canvas.height = image.height;

  // draw image
  ctx.drawImage(image, 0, 0);

  // extracted cropped image
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // Return as Base64 string
  return canvas.toDataURL('image/jpeg');
}
