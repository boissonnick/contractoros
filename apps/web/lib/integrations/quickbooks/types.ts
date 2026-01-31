/**
 * QuickBooks Online Integration Types
 *
 * Types specific to the QuickBooks Online API integration.
 * Generic accounting types are in types/index.ts
 */

// OAuth Types
export interface QBOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

export interface QBOTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: Date;
  realmId: string; // QuickBooks company ID
}

export interface QBOAuthState {
  orgId: string;
  userId: string;
  returnUrl?: string;
  nonce: string;
}

// API Response Types
export interface QBOApiError {
  fault: {
    error: Array<{
      code: string;
      element?: string;
      message: string;
      detail?: string;
    }>;
    type: string;
  };
}

export interface QBOQueryResponseMeta {
  startPosition: number;
  maxResults: number;
  totalCount?: number;
}

export interface QBOQueryResponse<T> {
  QueryResponse: QBOQueryResponseMeta & Record<string, T[]>;
  time: string;
}

// Customer Types (maps to ContractorOS Client)
export interface QBOCustomer {
  Id?: string;
  SyncToken?: string;
  DisplayName: string;
  CompanyName?: string;
  GivenName?: string;
  FamilyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  Mobile?: { FreeFormNumber: string };
  BillAddr?: QBOAddress;
  ShipAddr?: QBOAddress;
  Notes?: string;
  Active?: boolean;
  Balance?: number;
  BalanceWithJobs?: number;
  MetaData?: QBOMetaData;
}

export interface QBOAddress {
  Line1?: string;
  Line2?: string;
  City?: string;
  CountrySubDivisionCode?: string; // State
  PostalCode?: string;
  Country?: string;
}

export interface QBOMetaData {
  CreateTime: string;
  LastUpdatedTime: string;
}

// Invoice Types (maps to ContractorOS Invoice)
export interface QBOInvoice {
  Id?: string;
  SyncToken?: string;
  DocNumber?: string;
  TxnDate: string; // YYYY-MM-DD
  DueDate?: string;
  CustomerRef: QBORef;
  Line: QBOInvoiceLine[];
  BillEmail?: { Address: string };
  TotalAmt?: number;
  Balance?: number;
  PrivateNote?: string;
  CustomerMemo?: { value: string };
  TxnStatus?: 'Pending' | 'Emailed' | 'Paid' | 'Overdue';
  EmailStatus?: 'NotSet' | 'NeedToSend' | 'EmailSent';
  MetaData?: QBOMetaData;
}

export interface QBOInvoiceLine {
  Id?: string;
  LineNum?: number;
  Description?: string;
  Amount: number;
  DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail' | 'DiscountLineDetail';
  SalesItemLineDetail?: {
    ItemRef?: QBORef;
    UnitPrice?: number;
    Qty?: number;
    TaxCodeRef?: QBORef;
    ServiceDate?: string;
  };
}

export interface QBORef {
  value: string;
  name?: string;
}

// Payment Types
export interface QBOPayment {
  Id?: string;
  SyncToken?: string;
  TotalAmt: number;
  CustomerRef: QBORef;
  TxnDate: string;
  PaymentMethodRef?: QBORef;
  DepositToAccountRef?: QBORef;
  Line?: QBOPaymentLine[];
  PrivateNote?: string;
  MetaData?: QBOMetaData;
}

export interface QBOPaymentLine {
  Amount: number;
  LinkedTxn: Array<{
    TxnId: string;
    TxnType: 'Invoice' | 'CreditMemo' | 'JournalEntry';
  }>;
}

// Expense/Purchase Types
export interface QBOPurchase {
  Id?: string;
  SyncToken?: string;
  PaymentType: 'Cash' | 'Check' | 'CreditCard';
  AccountRef: QBORef;
  TxnDate: string;
  TotalAmt: number;
  Line: QBOPurchaseLine[];
  EntityRef?: QBORef;
  PrivateNote?: string;
  MetaData?: QBOMetaData;
}

export interface QBOPurchaseLine {
  Id?: string;
  Amount: number;
  DetailType: 'AccountBasedExpenseLineDetail' | 'ItemBasedExpenseLineDetail';
  AccountBasedExpenseLineDetail?: {
    AccountRef: QBORef;
    BillableStatus?: 'Billable' | 'NotBillable' | 'HasBeenBilled';
    CustomerRef?: QBORef;
    TaxCodeRef?: QBORef;
  };
  Description?: string;
}

// Company Info
export interface QBOCompanyInfo {
  Id: string;
  SyncToken: string;
  CompanyName: string;
  LegalName?: string;
  CompanyAddr?: QBOAddress;
  CustomerCommunicationAddr?: QBOAddress;
  PrimaryPhone?: { FreeFormNumber: string };
  Email?: { Address: string };
  WebAddr?: { URI: string };
  FiscalYearStartMonth?: string;
  Country?: string;
  MetaData?: QBOMetaData;
}

// Sync Mapping Types (stored in Firestore)
export interface QBOEntityMapping {
  id: string;
  orgId: string;
  entityType: 'client' | 'invoice' | 'payment' | 'expense';
  localId: string;
  qboId: string;
  qboSyncToken: string;
  lastSyncedAt: Date;
  syncStatus: 'synced' | 'pending' | 'error';
  syncError?: string;
}

// Webhook Types
export interface QBOWebhookPayload {
  eventNotifications: Array<{
    realmId: string;
    dataChangeEvent: {
      entities: Array<{
        name: 'Customer' | 'Invoice' | 'Payment' | 'Purchase';
        id: string;
        operation: 'Create' | 'Update' | 'Delete' | 'Merge' | 'Void';
        lastUpdated: string;
      }>;
    };
  }>;
}

// Constants
export const QBO_SCOPES = [
  'com.intuit.quickbooks.accounting',
  'openid',
  'profile',
  'email',
] as const;

export const QBO_API_ENDPOINTS = {
  sandbox: 'https://sandbox-quickbooks.api.intuit.com',
  production: 'https://quickbooks.api.intuit.com',
} as const;

export const QBO_AUTH_ENDPOINTS = {
  authorize: 'https://appcenter.intuit.com/connect/oauth2',
  token: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  revoke: 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke',
} as const;
