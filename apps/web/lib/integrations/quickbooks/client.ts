/**
 * QuickBooks Online API Client
 *
 * Handles authenticated API requests to QuickBooks Online.
 */

import { getValidAccessToken } from './oauth';
import {
  QBOApiError as QBOApiErrorResponse,
  QBOCompanyInfo,
  QBOQueryResponse,
  QBO_API_ENDPOINTS,
} from './types';

// Get environment (sandbox vs production)
const getApiBaseUrl = (): string => {
  const environment = (process.env.QUICKBOOKS_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox';
  return QBO_API_ENDPOINTS[environment];
};

/**
 * API Error class for QuickBooks errors
 */
export class QBOClientError extends Error {
  public readonly code: string;
  public readonly detail?: string;

  constructor(message: string, code: string, detail?: string) {
    super(message);
    this.name = 'QBOClientError';
    this.code = code;
    this.detail = detail;
  }
}

/**
 * Parse QBO API error response
 */
function parseErrorResponse(error: QBOApiErrorResponse): QBOClientError {
  if (error.fault?.error?.[0]) {
    const firstError = error.fault.error[0];
    return new QBOClientError(
      firstError.message,
      firstError.code,
      firstError.detail
    );
  }
  return new QBOClientError('Unknown QuickBooks API error', 'UNKNOWN');
}

/**
 * Make an authenticated request to the QuickBooks API
 */
export async function qboRequest<T>(
  orgId: string,
  method: 'GET' | 'POST' | 'DELETE',
  endpoint: string,
  body?: Record<string, unknown>
): Promise<T> {
  const auth = await getValidAccessToken(orgId);

  if (!auth) {
    throw new QBOClientError(
      'QuickBooks is not connected or token is invalid',
      'AUTH_ERROR'
    );
  }

  const { accessToken, realmId } = auth;
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/v3/company/${realmId}${endpoint}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let errorData: QBOApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Response is not JSON
    }

    if (errorData?.fault) {
      throw parseErrorResponse(errorData);
    }

    throw new QBOClientError(
      `QuickBooks API error: ${response.status} ${response.statusText}`,
      `HTTP_${response.status}`
    );
  }

  return response.json();
}

/**
 * Query QuickBooks data using their query language
 */
export async function qboQuery<T>(
  orgId: string,
  entity: string,
  query?: string,
  maxResults = 100,
  startPosition = 1
): Promise<QBOQueryResponse<T>> {
  let queryString = `SELECT * FROM ${entity}`;

  if (query) {
    queryString += ` WHERE ${query}`;
  }

  queryString += ` MAXRESULTS ${maxResults} STARTPOSITION ${startPosition}`;

  const encodedQuery = encodeURIComponent(queryString);
  return qboRequest<QBOQueryResponse<T>>(orgId, 'GET', `/query?query=${encodedQuery}`);
}

/**
 * Get company info (useful for verifying connection)
 */
export async function getCompanyInfo(orgId: string): Promise<QBOCompanyInfo> {
  const auth = await getValidAccessToken(orgId);

  if (!auth) {
    throw new QBOClientError(
      'QuickBooks is not connected or token is invalid',
      'AUTH_ERROR'
    );
  }

  const response = await qboRequest<{ CompanyInfo: QBOCompanyInfo }>(
    orgId,
    'GET',
    `/companyinfo/${auth.realmId}`
  );

  return response.CompanyInfo;
}

/**
 * Create an entity in QuickBooks
 */
export async function qboCreate<T>(
  orgId: string,
  entity: string,
  data: Record<string, unknown>
): Promise<T> {
  const response = await qboRequest<{ [key: string]: T }>(
    orgId,
    'POST',
    `/${entity.toLowerCase()}`,
    data
  );

  // QBO returns the entity keyed by its type name
  return response[entity];
}

/**
 * Update an entity in QuickBooks
 * Note: QBO requires the full entity with Id and SyncToken
 */
export async function qboUpdate<T>(
  orgId: string,
  entity: string,
  data: Record<string, unknown>
): Promise<T> {
  if (!data.Id || !data.SyncToken) {
    throw new QBOClientError(
      'Update requires Id and SyncToken',
      'VALIDATION_ERROR'
    );
  }

  const response = await qboRequest<{ [key: string]: T }>(
    orgId,
    'POST',
    `/${entity.toLowerCase()}?operation=update`,
    data
  );

  return response[entity];
}

/**
 * Delete (void) an entity in QuickBooks
 * Note: Most entities can only be voided, not deleted
 */
export async function qboDelete(
  orgId: string,
  entity: string,
  id: string,
  syncToken: string
): Promise<void> {
  await qboRequest(
    orgId,
    'POST',
    `/${entity.toLowerCase()}?operation=delete`,
    { Id: id, SyncToken: syncToken }
  );
}

/**
 * Batch request for multiple operations
 */
export async function qboBatch(
  orgId: string,
  operations: Array<{
    bId: string;
    operation: 'create' | 'update' | 'delete' | 'query';
    entity?: string;
    data?: Record<string, unknown>;
    query?: string;
  }>
): Promise<{
  BatchItemResponse: Array<{
    bId: string;
    [key: string]: unknown;
  }>;
}> {
  const batchRequest = {
    BatchItemRequest: operations.map((op) => ({
      bId: op.bId,
      operation: op.operation,
      [op.entity || 'Query']: op.operation === 'query' ? op.query : op.data,
    })),
  };

  return qboRequest(orgId, 'POST', '/batch', batchRequest);
}

// Re-export the error class with the original name for backwards compatibility
export { QBOClientError as QBOApiError };
