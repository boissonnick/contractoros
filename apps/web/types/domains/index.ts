/**
 * Domain Types Index
 *
 * This file re-exports all domain-specific types.
 * Import from here when you know the specific domain you need.
 *
 * For backward compatibility, the main types/index.ts also re-exports
 * these types, so existing imports continue to work.
 *
 * Usage:
 *   // Old way (still works, but reads more code)
 *   import { Client, UserProfile } from '@/types';
 *
 *   // New way (more efficient, reads less code)
 *   import { Client } from '@/types/domains/client';
 *   import { UserProfile } from '@/types/domains/core';
 */

// Core types (User, Organization, Auth)
export * from './core';

// Client management types
export * from './client';
