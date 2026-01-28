/**
 * Image optimization utilities for client-side image processing
 * Compresses and resizes images before upload to reduce storage costs and improve load times
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * Compresses and resizes an image file
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<Blob> - The compressed image as a Blob
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<Blob> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxWidth = opts.maxWidth!;
      const maxHeight = opts.maxHeight!;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image with white background (for transparency handling)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        opts.mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compresses an image file and returns a new File object
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise<File> - The compressed image as a File
 */
export async function compressImageFile(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const blob = await compressImage(file, options);
  const extension = options.mimeType === 'image/png' ? 'png' :
                    options.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const newName = file.name.replace(/\.[^.]+$/, `.${extension}`);
  return new File([blob], newName, { type: blob.type });
}

/**
 * Creates a thumbnail from an image file
 * @param file - The image file
 * @param size - The maximum dimension (width or height)
 * @returns Promise<Blob> - The thumbnail as a Blob
 */
export async function createThumbnail(
  file: File,
  size: number = 200
): Promise<Blob> {
  return compressImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    mimeType: 'image/jpeg',
  });
}

/**
 * Validates image file type and size
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @returns Object with isValid and error message
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10
): { isValid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

  if (!validTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.',
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File too large. Maximum size is ${maxSizeMB}MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Gets image dimensions from a file
 * @param file - The image file
 * @returns Promise<{ width: number, height: number }>
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Converts a data URL to a Blob
 * @param dataUrl - The data URL string
 * @returns Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Converts a Blob to a data URL
 * @param blob - The Blob to convert
 * @returns Promise<string> - The data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Profile photo preset - smaller dimensions, higher compression
 */
export const PROFILE_PHOTO_OPTIONS: ImageCompressionOptions = {
  maxWidth: 400,
  maxHeight: 400,
  quality: 0.85,
  mimeType: 'image/jpeg',
};

/**
 * Project photo preset - medium dimensions, balanced quality
 */
export const PROJECT_PHOTO_OPTIONS: ImageCompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  mimeType: 'image/jpeg',
};

/**
 * Document scan preset - larger dimensions, lower compression for text clarity
 */
export const DOCUMENT_SCAN_OPTIONS: ImageCompressionOptions = {
  maxWidth: 2400,
  maxHeight: 3200,
  quality: 0.9,
  mimeType: 'image/jpeg',
};

/**
 * Logo preset - preserves quality, smaller dimensions
 */
export const LOGO_OPTIONS: ImageCompressionOptions = {
  maxWidth: 500,
  maxHeight: 500,
  quality: 0.95,
  mimeType: 'image/png',
};
