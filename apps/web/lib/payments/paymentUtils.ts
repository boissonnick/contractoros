/**
 * Payment Utilities
 *
 * Helper functions for payment processing, formatting, and validation.
 */

import { Payment, PaymentStatus, PaymentMethod } from '@/types';

/**
 * Convert cents to dollars for display
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents for storage
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Import from centralized formatters and re-export
// Note: this version takes cents, hence using formatCurrencyFromCents
import { formatCurrencyFromCents } from '@/lib/utils/formatters';
export const formatCurrency = formatCurrencyFromCents;

/**
 * Format payment status for display
 */
export function formatPaymentStatus(status: PaymentStatus): string {
  const statusMap: Record<PaymentStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
    partially_refunded: 'Partially Refunded',
    cancelled: 'Cancelled',
  };
  return statusMap[status] || status;
}

/**
 * Get status color for UI
 */
export function getPaymentStatusColor(status: PaymentStatus): {
  bg: string;
  text: string;
  border: string;
} {
  const colors: Record<PaymentStatus, { bg: string; text: string; border: string }> = {
    pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
    processing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    completed: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    refunded: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    partially_refunded: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    cancelled: { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200' },
  };
  return colors[status] || colors.pending;
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: PaymentMethod): string {
  const methodMap: Record<PaymentMethod, string> = {
    card: 'Credit/Debit Card',
    ach: 'Bank Transfer (ACH)',
  };
  return methodMap[method] || method;
}

/**
 * Get card brand icon name
 */
export function getCardBrandIcon(brand: string | undefined): string {
  const brandMap: Record<string, string> = {
    visa: 'visa',
    mastercard: 'mastercard',
    amex: 'amex',
    discover: 'discover',
    diners: 'diners',
    jcb: 'jcb',
    unionpay: 'unionpay',
  };
  return brandMap[brand?.toLowerCase() || ''] || 'card';
}

/**
 * Format card brand for display
 */
export function formatCardBrand(brand: string | undefined): string {
  const brandMap: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
  };
  return brandMap[brand?.toLowerCase() || ''] || 'Card';
}

/**
 * Check if a card is expired
 */
export function isCardExpired(expMonth: number | undefined, expYear: number | undefined): boolean {
  if (!expMonth || !expYear) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  return expYear < currentYear || (expYear === currentYear && expMonth < currentMonth);
}

/**
 * Format card expiration for display
 */
export function formatCardExpiration(expMonth: number | undefined, expYear: number | undefined): string {
  if (!expMonth || !expYear) return '';
  return `${expMonth.toString().padStart(2, '0')}/${expYear.toString().slice(-2)}`;
}

/**
 * Calculate processing fee for a payment
 */
export function calculateProcessingFee(
  amount: number,
  method: PaymentMethod
): { fee: number; net: number } {
  // Stripe fee structure
  // Card: 2.9% + $0.30
  // ACH: 0.8% capped at $5

  let fee: number;

  if (method === 'card') {
    fee = Math.round(amount * 0.029 + 30); // 2.9% + 30 cents
  } else {
    fee = Math.min(Math.round(amount * 0.008), 500); // 0.8% capped at $5
  }

  return {
    fee,
    net: amount - fee,
  };
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(prefix: string = 'PAY'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a unique payment link token
 */
export function generatePaymentLinkToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(
  amount: number,
  min: number = 50, // $0.50 minimum
  max: number = 99999999 // ~$1M maximum
): { valid: boolean; error?: string } {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { valid: false, error: 'Invalid payment amount' };
  }
  if (amount < min) {
    return { valid: false, error: `Minimum payment amount is ${formatCurrency(min)}` };
  }
  if (amount > max) {
    return { valid: false, error: `Maximum payment amount is ${formatCurrency(max)}` };
  }
  return { valid: true };
}

/**
 * Get payment link expiration date (default: 7 days)
 */
export function getPaymentLinkExpiration(daysFromNow: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Check if a payment link is expired
 */
export function isPaymentLinkExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/**
 * Calculate deposit amount from total
 */
export function calculateDeposit(
  total: number,
  depositPercentage: number = 50
): { deposit: number; balance: number } {
  const deposit = Math.round(total * (depositPercentage / 100));
  return {
    deposit,
    balance: total - deposit,
  };
}

/**
 * Parse Stripe error into user-friendly message
 */
export function parseStripeError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  // Type guard for Stripe error
  if (typeof error === 'object' && error !== null && 'type' in error) {
    const stripeError = error as {
      type: string;
      code?: string;
      message?: string;
      decline_code?: string;
    };

    // Card decline codes
    if (stripeError.decline_code) {
      const declineMessages: Record<string, string> = {
        authentication_required: 'This card requires authentication. Please try again.',
        approve_with_id: 'Payment cannot be authorized. Please try a different card.',
        call_issuer: 'Your card was declined. Please contact your card issuer.',
        card_not_supported: 'This card does not support this type of purchase.',
        card_velocity_exceeded: 'Too many transactions. Please try again later.',
        currency_not_supported: 'This currency is not supported.',
        do_not_honor: 'Your card was declined. Please try a different card.',
        do_not_try_again: 'Your card was declined. Please contact your card issuer.',
        duplicate_transaction: 'A duplicate transaction was submitted.',
        expired_card: 'Your card has expired. Please use a different card.',
        fraudulent: 'Your card was declined.',
        generic_decline: 'Your card was declined. Please try a different card.',
        incorrect_cvc: 'The CVC number is incorrect.',
        incorrect_number: 'The card number is incorrect.',
        incorrect_zip: 'The ZIP/postal code is incorrect.',
        insufficient_funds: 'Your card has insufficient funds.',
        invalid_account: 'The card is not valid. Please try a different card.',
        invalid_amount: 'The payment amount is invalid.',
        invalid_cvc: 'The CVC number is invalid.',
        invalid_expiry_month: 'The expiration month is invalid.',
        invalid_expiry_year: 'The expiration year is invalid.',
        invalid_number: 'The card number is invalid.',
        issuer_not_available: 'Your card issuer is not available. Please try again.',
        lost_card: 'Your card was declined. Please contact your card issuer.',
        merchant_blacklist: 'Your card was declined.',
        new_account_information_available: 'Your card information has changed. Please update your card.',
        no_action_taken: 'Your card was declined. Please try again.',
        not_permitted: 'This payment is not permitted.',
        offline_pin_required: 'Your card requires a PIN. Please use a different card.',
        online_or_offline_pin_required: 'Your card requires a PIN.',
        pickup_card: 'Your card was declined. Please contact your card issuer.',
        pin_try_exceeded: 'Too many PIN attempts. Please contact your card issuer.',
        processing_error: 'An error occurred while processing. Please try again.',
        reenter_transaction: 'Please re-enter the transaction.',
        restricted_card: 'This card is restricted. Please try a different card.',
        revocation_of_all_authorizations: 'Your card was declined.',
        revocation_of_authorization: 'Your card was declined.',
        security_violation: 'Your card was declined for security reasons.',
        service_not_allowed: 'This service is not allowed.',
        stolen_card: 'Your card was declined. Please contact your card issuer.',
        stop_payment_order: 'Your card was declined.',
        testmode_decline: 'A test card was declined.',
        transaction_not_allowed: 'This transaction is not allowed.',
        try_again_later: 'Your card was temporarily declined. Please try again.',
        withdrawal_count_limit_exceeded: 'Transaction limit exceeded. Please try again later.',
      };

      return declineMessages[stripeError.decline_code] || 'Your card was declined. Please try a different card.';
    }

    // General Stripe error codes
    if (stripeError.code) {
      const errorMessages: Record<string, string> = {
        amount_too_large: 'The payment amount is too large.',
        amount_too_small: 'The payment amount is too small.',
        balance_insufficient: 'Your account has insufficient funds.',
        bank_account_declined: 'Your bank account was declined.',
        bank_account_unusable: 'This bank account cannot be used.',
        bank_account_unverified: 'This bank account has not been verified.',
        card_declined: 'Your card was declined.',
        expired_card: 'Your card has expired.',
        incorrect_address: 'The address is incorrect.',
        incorrect_cvc: 'The CVC is incorrect.',
        incorrect_number: 'The card number is incorrect.',
        incorrect_zip: 'The ZIP code is incorrect.',
        invalid_card_type: 'This card type is not supported.',
        invalid_expiry_month: 'The expiration month is invalid.',
        invalid_expiry_year: 'The expiration year is invalid.',
        invalid_number: 'The card number is invalid.',
        postal_code_invalid: 'The postal code is invalid.',
        processing_error: 'An error occurred during processing. Please try again.',
        rate_limit: 'Too many requests. Please try again later.',
      };

      return errorMessages[stripeError.code] || stripeError.message || 'An error occurred processing your payment.';
    }

    return stripeError.message || 'An error occurred processing your payment.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An error occurred processing your payment.';
}
