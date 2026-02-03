/**
 * Server-Side Field-Level Encryption Utilities
 *
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * Uses Node.js crypto module for server-side encryption in Cloud Functions.
 *
 * IMPORTANT: Encryption keys should be stored in GCP Secret Manager
 * and retrieved at runtime. Never hardcode keys.
 */

import * as crypto from 'crypto';

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

/** Algorithm for encryption */
const ALGORITHM = 'aes-256-gcm';

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
// Key Derivation
// =============================================================================

/**
 * Derive an encryption key from a password using PBKDF2
 *
 * @param password - The password/passphrase to derive the key from
 * @param salt - Base64-encoded salt (should be unique per encrypted item)
 * @param config - Optional key derivation configuration
 * @returns Promise resolving to the derived key as a Buffer
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
): Promise<Buffer> {
  const saltBuffer = Buffer.from(salt, 'base64');

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      password,
      saltBuffer,
      config.iterations,
      config.keyLength,
      'sha256',
      (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey);
        }
      }
    );
  });
}

/**
 * Derive an encryption key synchronously (use with caution - blocks event loop)
 *
 * @param password - The password/passphrase to derive the key from
 * @param salt - Base64-encoded salt
 * @param config - Optional key derivation configuration
 * @returns The derived key as a Buffer
 */
export function deriveKeySync(
  password: string,
  salt: string,
  config: KeyDerivationConfig = DEFAULT_KEY_CONFIG
): Buffer {
  const saltBuffer = Buffer.from(salt, 'base64');
  return crypto.pbkdf2Sync(
    password,
    saltBuffer,
    config.iterations,
    config.keyLength,
    'sha256'
  );
}

/**
 * Generate a cryptographically secure random salt
 *
 * @param length - Salt length in bytes (default: 16)
 * @returns Base64-encoded salt string
 */
export function generateSalt(length: number = DEFAULT_KEY_CONFIG.saltLength): string {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate a random encryption key (for testing or initial key generation)
 *
 * @returns 32-byte random key suitable for AES-256
 */
export function generateKey(): Buffer {
  return crypto.randomBytes(32);
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
 * const encrypted = encryptField('123-45-6789', encryptionKey);
 * // Store encrypted in Firestore
 * ```
 */
export function encryptField(plaintext: string, key: Buffer): EncryptedField {
  // Validate key length
  if (key.length !== 32) {
    throw new Error(`Invalid key length: ${key.length}. Expected 32 bytes for AES-256.`);
  }

  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get authentication tag
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('base64'),
    data: encrypted.toString('base64'),
    tag: tag.toString('base64'),
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
 * const ssn = decryptField(employee.ssnEncrypted, encryptionKey);
 * ```
 */
export function decryptField(encrypted: EncryptedField, key: Buffer): string {
  // Validate key length
  if (key.length !== 32) {
    throw new Error(`Invalid key length: ${key.length}. Expected 32 bytes for AES-256.`);
  }

  // Check version compatibility
  if (encrypted.version > CURRENT_ENCRYPTION_VERSION) {
    throw new Error(
      `Unsupported encryption version: ${encrypted.version}. ` +
        `Maximum supported: ${CURRENT_ENCRYPTION_VERSION}`
    );
  }

  // Decode Base64 components
  const iv = Buffer.from(encrypted.iv, 'base64');
  const data = Buffer.from(encrypted.data, 'base64');
  const tag = Buffer.from(encrypted.tag, 'base64');

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: TAG_LENGTH,
  });

  // Set auth tag
  decipher.setAuthTag(tag);

  try {
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
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
 * const encrypted = encryptSensitiveFields(employee, ['ssn'], key);
 * // encrypted.ssn is now an EncryptedField object
 * ```
 */
export function encryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  fieldsToEncrypt: (keyof T)[],
  key: Buffer
): T {
  const result = { ...data };

  for (const field of fieldsToEncrypt) {
    const value = data[field];

    // Only encrypt string values that exist and aren't already encrypted
    if (typeof value === 'string' && value.length > 0) {
      const encrypted = encryptField(value, key);
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
 * const decrypted = decryptSensitiveFields(employee, ['ssn'], key);
 * // decrypted.ssn is now the plaintext SSN
 * ```
 */
export function decryptSensitiveFields<T extends Record<string, unknown>>(
  data: T,
  encryptedFields: (keyof T)[],
  key: Buffer
): T {
  const result = { ...data };

  for (const field of encryptedFields) {
    const value = data[field];

    // Only decrypt EncryptedField objects
    if (isEncryptedField(value)) {
      try {
        const decrypted = decryptField(value, key);
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
  return sensitiveFields
    ? (sensitiveFields as readonly string[]).includes(fieldName)
    : false;
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
export function encryptBatch<T extends Record<string, unknown>>(
  items: T[],
  fieldsToEncrypt: (keyof T)[],
  key: Buffer
): T[] {
  return items.map((item) => encryptSensitiveFields(item, fieldsToEncrypt, key));
}

/**
 * Decrypt sensitive fields in multiple objects
 *
 * @param items - Array of objects with encrypted fields
 * @param encryptedFields - Array of field names that are encrypted
 * @param key - 32-byte encryption key
 * @returns Array of objects with decrypted fields
 */
export function decryptBatch<T extends Record<string, unknown>>(
  items: T[],
  encryptedFields: (keyof T)[],
  key: Buffer
): T[] {
  return items.map((item) => decryptSensitiveFields(item, encryptedFields, key));
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
export function rotateFieldKey(
  encrypted: EncryptedField,
  oldKey: Buffer,
  newKey: Buffer
): EncryptedField {
  // Decrypt with old key
  const plaintext = decryptField(encrypted, oldKey);

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
export function rotateObjectKeys<T extends Record<string, unknown>>(
  data: T,
  encryptedFields: (keyof T)[],
  oldKey: Buffer,
  newKey: Buffer
): T {
  const result = { ...data };

  for (const field of encryptedFields) {
    const value = data[field];

    if (isEncryptedField(value)) {
      const rotated = rotateFieldKey(value, oldKey, newKey);
      (result as Record<string, unknown>)[field as string] = rotated;
    }
  }

  return result;
}

// =============================================================================
// Secret Manager Integration
// =============================================================================

/**
 * Encryption key cache to avoid repeated Secret Manager calls
 */
let cachedEncryptionKey: Buffer | null = null;
let cacheExpiry: number = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the encryption key from Secret Manager
 *
 * This function retrieves the encryption key from GCP Secret Manager.
 * The key is cached for 5 minutes to reduce API calls.
 *
 * NOTE: Requires @google-cloud/secret-manager package to be installed.
 * Install with: npm install @google-cloud/secret-manager
 *
 * @param secretName - Name of the secret in Secret Manager
 * @param projectId - GCP project ID
 * @returns The encryption key as a Buffer
 *
 * @example
 * ```typescript
 * const key = await getEncryptionKeyFromSecretManager(
 *   'field-encryption-key',
 *   'contractoros-483812'
 * );
 * ```
 */
export async function getEncryptionKeyFromSecretManager(
  secretName: string = 'field-encryption-key',
  projectId: string = 'contractoros-483812'
): Promise<Buffer> {
  // Check cache first
  if (cachedEncryptionKey && Date.now() < cacheExpiry) {
    return cachedEncryptionKey;
  }

  try {
    // Dynamic require to avoid TypeScript checking the module at compile time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports
    let SecretManagerServiceClient: any;
    try {
      // Use require to avoid TypeScript module resolution issues
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const secretManager = require('@google-cloud/secret-manager');
      SecretManagerServiceClient = secretManager.SecretManagerServiceClient;
    } catch {
      throw new Error(
        'Secret Manager client not available. Install @google-cloud/secret-manager package.'
      );
    }

    const client = new SecretManagerServiceClient();
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data;

    if (!payload) {
      throw new Error(`Secret ${secretName} has no payload`);
    }

    // Secret should be stored as base64-encoded key
    const keyString =
      typeof payload === 'string' ? payload : payload.toString('utf8');

    cachedEncryptionKey = Buffer.from(keyString.trim(), 'base64');
    cacheExpiry = Date.now() + CACHE_DURATION_MS;

    // Validate key length
    if (cachedEncryptionKey.length !== 32) {
      throw new Error(
        `Invalid encryption key length: ${cachedEncryptionKey.length}. Expected 32 bytes.`
      );
    }

    return cachedEncryptionKey;
  } catch (error) {
    // Clear cache on error
    cachedEncryptionKey = null;
    cacheExpiry = 0;
    throw error;
  }
}

/**
 * Clear the cached encryption key
 * Call this when key rotation occurs or for security purposes
 */
export function clearEncryptionKeyCache(): void {
  cachedEncryptionKey = null;
  cacheExpiry = 0;
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

// =============================================================================
// Firestore Trigger Helpers
// =============================================================================

/**
 * Encrypt sensitive fields before writing to Firestore
 * Use in Firestore triggers (onCreate, onUpdate)
 *
 * @param data - Document data to process
 * @param entityType - Type of entity for field detection
 * @returns Data with sensitive fields encrypted
 *
 * @example
 * ```typescript
 * export const onEmployeeCreate = onDocumentCreated(
 *   'organizations/{orgId}/employees/{employeeId}',
 *   async (event) => {
 *     const data = event.data?.data();
 *     if (data) {
 *       const encrypted = await encryptBeforeWrite(data, 'employee');
 *       await event.data?.ref.set(encrypted);
 *     }
 *   }
 * );
 * ```
 */
export async function encryptBeforeWrite<T extends Record<string, unknown>>(
  data: T,
  entityType: SensitiveFieldKeys
): Promise<T> {
  const sensitiveFields = getSensitiveFieldsForEntity(entityType);
  if (sensitiveFields.length === 0) {
    return data;
  }

  const key = await getEncryptionKeyFromSecretManager();
  return encryptSensitiveFields(data, sensitiveFields as (keyof T)[], key);
}

/**
 * Decrypt sensitive fields after reading from Firestore
 * Use in Cloud Functions when processing documents
 *
 * @param data - Document data to process
 * @param entityType - Type of entity for field detection
 * @returns Data with sensitive fields decrypted
 */
export async function decryptAfterRead<T extends Record<string, unknown>>(
  data: T,
  entityType: SensitiveFieldKeys
): Promise<T> {
  const sensitiveFields = getSensitiveFieldsForEntity(entityType);
  if (sensitiveFields.length === 0) {
    return data;
  }

  const key = await getEncryptionKeyFromSecretManager();
  return decryptSensitiveFields(data, sensitiveFields as (keyof T)[], key);
}
