/**
 * Field-Level Encryption Utilities
 *
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * Uses Web Crypto API for client-side encryption.
 *
 * IMPORTANT: Keys should be stored in secure key management (GCP Secret Manager)
 * and never hardcoded or stored in client-side code.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Represents an encrypted field with all necessary components for decryption
 */
export interface EncryptedField {
  /** Base64-encoded initialization vector (12 bytes for GCM) */
  iv: string;
  /** Base64-encoded encrypted data */
  data: string;
  /** Base64-encoded authentication tag (16 bytes for GCM) */
  tag: string;
  /** Encryption version for key rotation support */
  version: number;
}

/**
 * Configuration for key derivation
 */
export interface KeyDerivationConfig {
  /** Number of PBKDF2 iterations (minimum 100000 recommended) */
  iterations: number;
  /** Salt length in bytes */
  saltLength: number;
  /** Derived key length in bytes (32 for AES-256) */
  keyLength: number;
}

/**
 * Result of encrypting multiple fields
 */
export interface EncryptionResult<T> {
  data: T;
  encryptedFields: string[];
}

/**
 * Type alias for encryption key - can be Buffer or Uint8Array
 */
export type EncryptionKey = Buffer | Uint8Array;

// =============================================================================
// Constants
// =============================================================================

/** Current encryption version - increment when changing algorithm/parameters */
export const CURRENT_ENCRYPTION_VERSION = 1;

/** Default key derivation configuration */
export const DEFAULT_KEY_CONFIG: KeyDerivationConfig = {
  iterations: 100000,
  keyLength: 32, // 256 bits for AES-256
  saltLength: 16, // 128 bits
};

/** IV length for AES-GCM (12 bytes is recommended for GCM) */
const IV_LENGTH = 12;

/** Authentication tag length for AES-GCM (128 bits) */
const TAG_LENGTH = 16;

/**
 * Sensitive fields by entity type that should be encrypted
 */
export const SENSITIVE_FIELDS = {
  employee: ['ssn', 'bankAccountNumber', 'routingNumber', 'taxId'],
  subcontractor: ['ein', 'bankAccountNumber', 'routingNumber', 'taxId'],
  organization: ['stripeSecretKey', 'qboClientSecret', 'apiSecrets'],
  payroll: ['ssn', 'bankAccountNumber', 'routingNumber', 'taxWithholding'],
  client: ['ssn', 'taxId'],
} as const;

/**
 * Type for sensitive field keys
 */
export type SensitiveFieldKeys = keyof typeof SENSITIVE_FIELDS;

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Convert Uint8Array to Base64 string
 */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert key to Uint8Array (handles Buffer and Uint8Array)
 */
function keyToUint8Array(key: EncryptionKey): Uint8Array {
  if (key instanceof Uint8Array) {
    return key;
  }
  // Handle Node.js Buffer
  return new Uint8Array(key);
}

/**
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Fallback for Node.js environment without Web Crypto
    throw new Error(
      'No cryptographic random number generator available. Use server-side encryption module.'
    );
  }
  return bytes;
}

// =============================================================================
// Key Derivation
// =============================================================================

/**
 * Derive an encryption key from a password using PBKDF2
 *
 * @param password - The password/passphrase to derive the key from
 * @param salt - Base64-encoded salt (should be unique per encrypted item)
 * @param config - Optional key derivation configuration
 * @returns Promise resolving to the derived key as a Uint8Array
 *
 * @example
 * ```typescript
 * const salt = generateSalt();
 * const key = await deriveKey('my-secure-password', salt);
 * ```
 */
export async function deriveKey(
  password: string,
  salt: string,
  config: KeyDerivationConfig = DEFAULT_KEY_CONFIG
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = base64ToUint8Array(salt);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer as ArrayBuffer,
      iterations: config.iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    config.keyLength * 8 // Convert bytes to bits
  );

  return new Uint8Array(derivedBits);
}

/**
 * Generate a cryptographically secure random salt
 *
 * @param length - Salt length in bytes (default: 16)
 * @returns Base64-encoded salt string
 */
export function generateSalt(length: number = DEFAULT_KEY_CONFIG.saltLength): string {
  const saltBytes = generateRandomBytes(length);
  return uint8ArrayToBase64(saltBytes);
}

// =============================================================================
// Core Encryption/Decryption
// =============================================================================

/**
 * Encrypt a plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @param key - 32-byte encryption key (from deriveKey or Secret Manager)
 * @returns Encrypted field object with iv, data, tag, and version
 *
 * @example
 * ```typescript
 * const encrypted = await encryptField('123-45-6789', encryptionKey);
 * // Store encrypted in database
 * ```
 */
export async function encryptField(
  plaintext: string,
  key: EncryptionKey
): Promise<EncryptedField> {
  const keyBytes = keyToUint8Array(key);

  // Validate key length
  if (keyBytes.length !== 32) {
    throw new Error(`Invalid key length: ${keyBytes.length}. Expected 32 bytes for AES-256.`);
  }

  // Generate random IV
  const iv = generateRandomBytes(IV_LENGTH);

  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Encode plaintext
  const encoder = new TextEncoder();
  const plaintextBuffer = encoder.encode(plaintext);

  // Encrypt with AES-GCM (tag is appended to ciphertext)
  const ciphertextWithTag = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv.buffer as ArrayBuffer,
      tagLength: TAG_LENGTH * 8, // 128 bits
    },
    cryptoKey,
    plaintextBuffer
  );

  // Split ciphertext and tag (tag is last 16 bytes)
  const ciphertextWithTagArray = new Uint8Array(ciphertextWithTag);
  const ciphertext = ciphertextWithTagArray.slice(0, -TAG_LENGTH);
  const tag = ciphertextWithTagArray.slice(-TAG_LENGTH);

  return {
    iv: uint8ArrayToBase64(iv),
    data: uint8ArrayToBase64(ciphertext),
    tag: uint8ArrayToBase64(tag),
    version: CURRENT_ENCRYPTION_VERSION,
  };
}

/**
 * Decrypt an encrypted field using AES-256-GCM
 *
 * @param encrypted - The encrypted field object
 * @param key - 32-byte encryption key (must match the key used for encryption)
 * @returns Decrypted plaintext string
 *
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @example
 * ```typescript
 * const ssn = await decryptField(employee.ssnEncrypted, encryptionKey);
 * ```
 */
export async function decryptField(
  encrypted: EncryptedField,
  key: EncryptionKey
): Promise<string> {
  const keyBytes = keyToUint8Array(key);

  // Validate key length
  if (keyBytes.length !== 32) {
    throw new Error(`Invalid key length: ${keyBytes.length}. Expected 32 bytes for AES-256.`);
  }

  // Check version compatibility
  if (encrypted.version > CURRENT_ENCRYPTION_VERSION) {
    throw new Error(
      `Unsupported encryption version: ${encrypted.version}. ` +
        `Maximum supported: ${CURRENT_ENCRYPTION_VERSION}`
    );
  }

  // Decode Base64 components
  const iv = base64ToUint8Array(encrypted.iv);
  const ciphertext = base64ToUint8Array(encrypted.data);
  const tag = base64ToUint8Array(encrypted.tag);

  // Combine ciphertext and tag (AES-GCM expects them together)
  const ciphertextWithTag = new Uint8Array(ciphertext.length + tag.length);
  ciphertextWithTag.set(ciphertext);
  ciphertextWithTag.set(tag, ciphertext.length);

  // Import the key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  try {
    // Decrypt
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer,
        tagLength: TAG_LENGTH * 8,
      },
      cryptoKey,
      ciphertextWithTag.buffer as ArrayBuffer
    );

    // Decode to string
    const decoder = new TextDecoder();
    return decoder.decode(plaintextBuffer);
  } catch {
    throw new Error(
      'Decryption failed. This may indicate an incorrect key or tampered data.'
    );
  }
}

// =============================================================================
// Higher-Level Helpers
// =============================================================================

/**
 * Type guard to check if a value is an EncryptedField
 */
export function isEncryptedField(value: unknown): value is EncryptedField {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.iv === 'string' &&
    typeof obj.data === 'string' &&
    typeof obj.tag === 'string' &&
    typeof obj.version === 'number'
  );
}

/**
 * Encrypt specified fields in an object
 *
 * @param data - The object containing fields to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @param key - 32-byte encryption key
 * @returns New object with specified fields encrypted
 *
 * @example
 * ```typescript
 * const employee = {
 *   name: 'John Doe',
 *   ssn: '123-45-6789',
 *   email: 'john@example.com'
 * };
 * const encrypted = await encryptSensitiveFields(employee, ['ssn'], key);
 * // encrypted.ssn is now an EncryptedField object
 * ```
 */
export async function encryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  key: EncryptionKey
): Promise<T> {
  const result = { ...data };

  for (const field of fieldsToEncrypt) {
    const value = data[field];

    // Only encrypt string values that exist and aren't already encrypted
    if (typeof value === 'string' && value.length > 0) {
      const encrypted = await encryptField(value, key);
      (result as Record<string, unknown>)[field as string] = encrypted;
    } else if (isEncryptedField(value)) {
      // Already encrypted, skip
      continue;
    }
  }

  return result;
}

/**
 * Decrypt specified fields in an object
 *
 * @param data - The object containing encrypted fields
 * @param encryptedFields - Array of field names that are encrypted
 * @param key - 32-byte encryption key
 * @returns New object with specified fields decrypted
 *
 * @example
 * ```typescript
 * const employee = await getEmployee(id);
 * const decrypted = await decryptSensitiveFields(employee, ['ssn'], key);
 * // decrypted.ssn is now the plaintext SSN
 * ```
 */
export async function decryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  encryptedFields: (keyof T)[],
  key: EncryptionKey
): Promise<T> {
  const result = { ...data };

  for (const field of encryptedFields) {
    const value = data[field];

    // Only decrypt EncryptedField objects
    if (isEncryptedField(value)) {
      try {
        const decrypted = await decryptField(value, key);
        (result as Record<string, unknown>)[field as string] = decrypted;
      } catch (error) {
        console.error(`Failed to decrypt field '${String(field)}':`, error);
        // Leave as encrypted on failure
      }
    }
  }

  return result;
}

/**
 * Get the list of sensitive fields for a given entity type
 *
 * @param entityType - The type of entity (employee, subcontractor, etc.)
 * @returns Array of field names that should be encrypted
 */
export function getSensitiveFieldsForEntity(
  entityType: SensitiveFieldKeys
): readonly string[] {
  return SENSITIVE_FIELDS[entityType] || [];
}

/**
 * Check if a field name is considered sensitive for a given entity type
 *
 * @param entityType - The type of entity
 * @param fieldName - The field name to check
 * @returns True if the field should be encrypted
 */
export function isSensitiveField(
  entityType: SensitiveFieldKeys,
  fieldName: string
): boolean {
  const sensitiveFields = SENSITIVE_FIELDS[entityType];
  return sensitiveFields ? (sensitiveFields as readonly string[]).includes(fieldName) : false;
}

// =============================================================================
// Batch Operations
// =============================================================================

/**
 * Encrypt sensitive fields in multiple objects
 *
 * @param items - Array of objects to encrypt
 * @param fieldsToEncrypt - Array of field names to encrypt
 * @param key - 32-byte encryption key
 * @returns Array of objects with encrypted fields
 */
export async function encryptBatch<T extends Record<string, unknown>>(
  items: T[],
  fieldsToEncrypt: (keyof T)[],
  key: EncryptionKey
): Promise<T[]> {
  return Promise.all(items.map((item) => encryptSensitiveFields(item, fieldsToEncrypt, key)));
}

/**
 * Decrypt sensitive fields in multiple objects
 *
 * @param items - Array of objects with encrypted fields
 * @param encryptedFields - Array of field names that are encrypted
 * @param key - 32-byte encryption key
 * @returns Array of objects with decrypted fields
 */
export async function decryptBatch<T extends Record<string, unknown>>(
  items: T[],
  encryptedFields: (keyof T)[],
  key: EncryptionKey
): Promise<T[]> {
  return Promise.all(items.map((item) => decryptSensitiveFields(item, encryptedFields, key)));
}

// =============================================================================
// Key Rotation Support
// =============================================================================

/**
 * Re-encrypt a field with a new key (for key rotation)
 *
 * @param encrypted - The currently encrypted field
 * @param oldKey - The current encryption key
 * @param newKey - The new encryption key
 * @returns Newly encrypted field with updated version
 */
export async function rotateFieldKey(
  encrypted: EncryptedField,
  oldKey: EncryptionKey,
  newKey: EncryptionKey
): Promise<EncryptedField> {
  // Decrypt with old key
  const plaintext = await decryptField(encrypted, oldKey);

  // Re-encrypt with new key
  return encryptField(plaintext, newKey);
}

/**
 * Re-encrypt all sensitive fields in an object with a new key
 *
 * @param data - Object with encrypted fields
 * @param encryptedFields - List of encrypted field names
 * @param oldKey - Current encryption key
 * @param newKey - New encryption key
 * @returns Object with fields re-encrypted using new key
 */
export async function rotateObjectKeys<T extends Record<string, unknown>>(
  data: T,
  encryptedFields: (keyof T)[],
  oldKey: EncryptionKey,
  newKey: EncryptionKey
): Promise<T> {
  const result = { ...data };

  for (const field of encryptedFields) {
    const value = data[field];

    if (isEncryptedField(value)) {
      const rotated = await rotateFieldKey(value, oldKey, newKey);
      (result as Record<string, unknown>)[field as string] = rotated;
    }
  }

  return result;
}

// =============================================================================
// Masking Utilities (for display purposes)
// =============================================================================

/**
 * Mask a sensitive value for display (e.g., "***-**-6789" for SSN)
 *
 * @param value - The sensitive value to mask
 * @param visibleChars - Number of characters to show at the end
 * @param maskChar - Character to use for masking
 * @returns Masked string
 */
export function maskSensitiveValue(
  value: string,
  visibleChars: number = 4,
  maskChar: string = '*'
): string {
  if (!value || value.length <= visibleChars) {
    return maskChar.repeat(value?.length || 4);
  }

  const masked = maskChar.repeat(value.length - visibleChars);
  const visible = value.slice(-visibleChars);
  return masked + visible;
}

/**
 * Format and mask an SSN for display
 *
 * @param ssn - The SSN to mask (can be encrypted or plaintext)
 * @returns Masked SSN in format "***-**-XXXX"
 */
export function maskSSN(ssn: string | EncryptedField): string {
  if (isEncryptedField(ssn)) {
    return '***-**-****';
  }

  // Remove any existing formatting
  const digits = ssn.replace(/\D/g, '');

  if (digits.length !== 9) {
    return '***-**-****';
  }

  return `***-**-${digits.slice(-4)}`;
}

/**
 * Format and mask a bank account number for display
 *
 * @param accountNumber - The account number to mask
 * @returns Masked account number showing last 4 digits
 */
export function maskBankAccount(accountNumber: string | EncryptedField): string {
  if (isEncryptedField(accountNumber)) {
    return '****...****';
  }

  const digits = accountNumber.replace(/\D/g, '');

  if (digits.length <= 4) {
    return '****';
  }

  return `****${digits.slice(-4)}`;
}
