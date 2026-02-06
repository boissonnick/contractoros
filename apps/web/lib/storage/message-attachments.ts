/**
 * Message Attachment Upload Utilities
 *
 * Handles file uploads to Firebase Storage for client portal messages.
 */

import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024; // 25MB

// Allowed file types
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx'];

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface UploadedAttachment {
  url: string;
  name: string;
  type: 'image' | 'document' | 'other';
  size: number;
}

/**
 * Validates file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  const extension = file.name.split('.').pop()?.toLowerCase();

  // Check extension
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  // Check file type and size
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDocument = ALLOWED_DOCUMENT_TYPES.includes(file.type);

  if (!isImage && !isDocument) {
    return {
      valid: false,
      error: `File type "${file.type}" is not supported`,
    };
  }

  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image files must be under ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`,
    };
  }

  if (isDocument && file.size > MAX_DOCUMENT_SIZE) {
    return {
      valid: false,
      error: `Document files must be under ${MAX_DOCUMENT_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Generates a unique filename to prevent collisions
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${baseName}_${timestamp}_${random}.${extension}`;
}

/**
 * Determines the attachment type based on filename
 */
export function getAttachmentType(filename: string): 'image' | 'document' | 'other' {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (!extension) return 'other';

  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'image';
  }

  if (['pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(extension)) {
    return 'document';
  }

  return 'other';
}

/**
 * Uploads a file attachment to Firebase Storage
 *
 * @param file - The file to upload
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @param onProgress - Optional callback for upload progress
 * @returns Promise resolving to the download URL
 */
export async function uploadMessageAttachment(
  file: File,
  orgId: string,
  projectId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  // Validate the file
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Generate unique filename
  const uniqueFilename = generateUniqueFilename(file.name);

  // Create storage reference
  const storagePath = `organizations/${orgId}/projects/${projectId}/messages/${uniqueFilename}`;
  const storageRef = ref(storage, storagePath);

  // Create upload task
  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  });

  // Return a promise that resolves when upload completes
  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Handle progress updates
        if (onProgress) {
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
          };
          onProgress(progress);
        }
      },
      (error) => {
        // Handle errors
        logger.error('Upload error', { error: error, component: 'storage-message-attachments' });
        switch (error.code) {
          case 'storage/unauthorized':
            reject(new Error('You do not have permission to upload files'));
            break;
          case 'storage/canceled':
            reject(new Error('Upload was cancelled'));
            break;
          case 'storage/quota-exceeded':
            reject(new Error('Storage quota exceeded'));
            break;
          default:
            reject(new Error('Failed to upload file. Please try again.'));
        }
      },
      async () => {
        // Upload completed successfully
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          logger.error('Error getting download URL', { error: error, component: 'storage-message-attachments' });
          reject(new Error('Failed to get download URL'));
        }
      }
    );
  });
}

/**
 * Uploads multiple attachments and returns their URLs
 *
 * @param files - Array of files to upload
 * @param orgId - Organization ID
 * @param projectId - Project ID
 * @param onProgress - Optional callback for overall upload progress
 * @returns Promise resolving to array of uploaded attachment info
 */
export async function uploadMultipleAttachments(
  files: File[],
  orgId: string,
  projectId: string,
  onProgress?: (current: number, total: number, fileProgress: UploadProgress) => void
): Promise<UploadedAttachment[]> {
  const results: UploadedAttachment[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const url = await uploadMessageAttachment(file, orgId, projectId, (progress) => {
      if (onProgress) {
        onProgress(i + 1, files.length, progress);
      }
    });

    results.push({
      url,
      name: file.name,
      type: getAttachmentType(file.name),
      size: file.size,
    });
  }

  return results;
}

/**
 * Deletes an attachment from Firebase Storage
 *
 * @param url - The download URL of the file to delete
 */
export async function deleteMessageAttachment(url: string): Promise<void> {
  try {
    // Extract the storage path from the URL
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    logger.error('Error deleting attachment', { error: error, component: 'storage-message-attachments' });
    throw new Error('Failed to delete attachment');
  }
}

/**
 * File size constants for reference
 */
export const FILE_LIMITS = {
  maxImageSize: MAX_IMAGE_SIZE,
  maxDocumentSize: MAX_DOCUMENT_SIZE,
  allowedExtensions: ALLOWED_EXTENSIONS,
  allowedImageTypes: ALLOWED_IMAGE_TYPES,
  allowedDocumentTypes: ALLOWED_DOCUMENT_TYPES,
};
