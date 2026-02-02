/**
 * Photo Compression Utilities
 * Optimized for offline storage and upload
 */

// Default compression settings
const DEFAULT_MAX_WIDTH = 2048;
const DEFAULT_QUALITY = 0.85;
const THUMBNAIL_SIZE = 200;
const THUMBNAIL_QUALITY = 0.6;

/**
 * Compress a photo blob for storage/upload
 * Reduces file size while maintaining acceptable quality
 */
export async function compressPhoto(
  blob: Blob,
  maxWidth: number = DEFAULT_MAX_WIDTH,
  quality: number = DEFAULT_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      // Create canvas and draw
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to compress photo'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };

    img.src = url;
  });
}

/**
 * Create a small thumbnail as base64 for quick display
 * Used in pending photos grid for instant display without loading full image
 */
export async function createThumbnail(
  blob: Blob,
  size: number = THUMBNAIL_SIZE
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions to maintain aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > size) {
          height = Math.round((height * size) / width);
          width = size;
        }
      } else {
        if (height > size) {
          width = Math.round((width * size) / height);
          height = size;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      ctx.drawImage(img, 0, 0, width, height);

      // Return as base64 data URL
      resolve(canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = url;
  });
}

/**
 * Convert Blob to ArrayBuffer for IndexedDB storage
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Convert ArrayBuffer back to Blob
 */
export function arrayBufferToBlob(buffer: ArrayBuffer, type: string = 'image/jpeg'): Blob {
  return new Blob([buffer], { type });
}

/**
 * Get image dimensions from a blob
 */
export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Estimate the storage size of a pending photo
 * (compressed blob + thumbnail base64 + metadata)
 */
export function estimateStorageSize(blobSize: number, thumbnailBase64Length: number): number {
  // Blob size + base64 overhead (1.37x) + estimated metadata (1KB)
  return blobSize + Math.ceil(thumbnailBase64Length * 0.75) + 1024;
}
