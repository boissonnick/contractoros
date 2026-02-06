/**
 * Google Business Profile Integration Types
 * Sprint 75: Review monitoring OAuth types
 */

// OAuth Configuration
export interface GoogleBusinessOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// OAuth State passed through authorization flow
export interface GoogleBusinessAuthState {
  orgId: string;
  userId: string;
  nonce: string;
}

// OAuth Tokens
export interface GoogleBusinessTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  scope: string;
}

// API Endpoints
export const GOOGLE_OAUTH_ENDPOINTS = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  revoke: 'https://oauth2.googleapis.com/revoke',
};

// Required scopes for Google Business Profile
export const GOOGLE_BUSINESS_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
];

// Google My Business API base URL
export const GOOGLE_BUSINESS_API_BASE = 'https://mybusinessbusinessinformation.googleapis.com/v1';
export const GOOGLE_REVIEWS_API_BASE = 'https://mybusiness.googleapis.com/v4';
