/**
 * Photo Processing Utilities
 *
 * Handles image compression, metadata extraction, and thumbnail generation
 * for the photo documentation system.
 */

export interface ImageMetadata {
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  originalFilename: string;
  // EXIF data (if available)
  takenAt?: Date;
  location?: {
    lat: number;
    lng: number;
  };
  deviceModel?: string;
}

export interface ProcessedImage {
  file: File;
  thumbnail: Blob;
  metadata: ImageMetadata;
}

// Maximum dimensions for processed images
const MAX_WIDTH = 2048;
const MAX_HEIGHT = 2048;
const THUMBNAIL_SIZE = 300;
const JPEG_QUALITY = 0.85;
const THUMBNAIL_QUALITY = 0.7;

/**
 * Extract metadata from an image file
 */
export async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const metadata: ImageMetadata = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        fileSize: file.size,
        mimeType: file.type,
        originalFilename: file.name,
      };

      // Try to extract EXIF data for date and location
      // Note: Full EXIF extraction would require a library like exif-js
      // For now, we'll use file.lastModified as a fallback
      if (file.lastModified) {
        metadata.takenAt = new Date(file.lastModified);
      }

      resolve(metadata);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        width: 0,
        height: 0,
        fileSize: file.size,
        mimeType: file.type,
        originalFilename: file.name,
      });
    };

    img.src = url;
  });
}

/**
 * Compress an image while maintaining aspect ratio
 */
export async function compressImage(
  file: File,
  maxWidth = MAX_WIDTH,
  maxHeight = MAX_HEIGHT,
  quality = JPEG_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Calculate new dimensions maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
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
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  size = THUMBNAIL_SIZE
): Promise<Blob> {
  return compressImage(file, size, size, THUMBNAIL_QUALITY);
}

/**
 * Process an image: compress, generate thumbnail, and extract metadata
 */
export async function processImage(file: File): Promise<ProcessedImage> {
  // Run all operations in parallel
  const [metadata, compressedBlob, thumbnailBlob] = await Promise.all([
    extractImageMetadata(file),
    compressImage(file),
    generateThumbnail(file),
  ]);

  // Create a new File from the compressed blob
  const compressedFile = new File([compressedBlob], file.name, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  return {
    file: compressedFile,
    thumbnail: thumbnailBlob,
    metadata: {
      ...metadata,
      fileSize: compressedFile.size, // Update with compressed size
    },
  };
}

/**
 * Convert a blob to a data URL
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a data URL to a blob
 */
export function dataURLToBlob(dataURL: string): Blob {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Get current location (with user permission)
 */
export function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // User denied or error occurred
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Check if a file is a valid image
 */
export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
  return validTypes.includes(file.type) || file.name.match(/\.(jpg|jpeg|png|gif|webp|heic|heif)$/i) !== null;
}

/**
 * Generate a unique filename for upload
 */
export function generatePhotoFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop()?.toLowerCase() || 'jpg';
  return `${timestamp}_${random}.${ext}`;
}
