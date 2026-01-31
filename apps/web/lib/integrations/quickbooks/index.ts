/**
 * QuickBooks Online Integration
 *
 * Export all QuickBooks integration functionality.
 */

// OAuth & Authentication
export {
  isQuickBooksConfigured,
  getAuthorizationUrl,
  decodeAuthState,
  exchangeCodeForTokens,
  refreshAccessToken,
  revokeTokens,
  storeConnection,
  getConnection,
  updateTokens,
  deleteConnection,
  getValidAccessToken,
  generateNonce,
} from './oauth';

// API Client
export {
  QBOClientError,
  QBOApiError,
  qboRequest,
  qboQuery,
  qboCreate,
  qboUpdate,
  qboDelete,
  qboBatch,
  getCompanyInfo,
} from './client';

// Customer Sync
export {
  clientToQBOCustomer,
  qboCustomerToClientUpdate,
  pushClientToQBO,
  pullCustomersFromQBO,
  syncClientsToQBO,
  findQBOCustomerByEmail,
  autoLinkClientsByEmail,
  getClientSyncStatus,
} from './sync-customers';

// Invoice Sync
export {
  invoiceToQBOInvoice,
  qboInvoiceToInvoiceUpdate,
  pushInvoiceToQBO,
  pullInvoiceUpdatesFromQBO,
  syncInvoicesToQBO,
  syncInvoiceOnSend,
  getInvoiceSyncStatus,
  getSyncedInvoices,
  voidInvoiceInQBO,
} from './sync-invoices';

// Entity Mapping
export {
  getMapping,
  getMappingByQboId,
  createMapping,
  updateMapping,
  deleteMapping,
  getAllMappings,
  getMappingsByLocalIds,
  getMappingsByQboIds,
  upsertMapping,
  markMappingError,
} from './entity-mapping';

// Payment Sync
export {
  pullPaymentsFromQBO,
  processPaymentWebhook,
  getPaymentSyncStatus,
} from './sync-payments';

export type { PaymentSyncResult } from './sync-payments';

// Expense Sync
export {
  expenseToQBOPurchase,
  pushExpenseToQBO,
  syncExpensesToQBO,
  syncExpenseOnApproval,
  getExpenseSyncStatus,
} from './sync-expenses';

// Sync Logger
export {
  startSyncLog,
  completeSyncLog,
  failSyncLog,
  getSyncLogs,
  getLastSyncLog,
  isSyncInProgress,
  cleanupOldLogs,
  getSyncStats,
} from './sync-logger';

export type { SyncAction, SyncLogStatus, SyncLog, SyncResult } from './sync-logger';

// Types
export type {
  QBOAuthConfig,
  QBOAuthState,
  QBOTokens,
  QBOCustomer,
  QBOInvoice,
  QBOInvoiceLine,
  QBOPayment,
  QBOPaymentLine,
  QBOPurchase,
  QBOPurchaseLine,
  QBOAddress,
  QBORef,
  QBOCompanyInfo,
  QBOEntityMapping,
  QBOWebhookPayload,
  QBOQueryResponse,
} from './types';

export {
  QBO_SCOPES,
  QBO_API_ENDPOINTS,
  QBO_AUTH_ENDPOINTS,
} from './types';
