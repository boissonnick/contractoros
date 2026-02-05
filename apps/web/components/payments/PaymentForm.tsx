"use client";

import React, { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/lib/payments/paymentUtils';
import { stripePublishableKey } from '@/lib/payments/stripeClient';
import {
  CreditCardIcon,
  BanknotesIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

// Initialize Stripe
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

export interface PaymentFormProps {
  clientSecret: string;
  amount: number; // in cents
  description?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  returnUrl?: string;
}

/**
 * PaymentFormInner - The actual payment form (must be inside Elements provider)
 */
function PaymentFormInner({
  amount,
  description,
  onSuccess,
  onError,
  onCancel,
  returnUrl,
}: Omit<PaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl || `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage({ type: 'error', text: error.message || 'Payment failed' });
      onError?.(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setMessage({ type: 'success', text: 'Payment successful!' });
      onSuccess?.(paymentIntent.id);
    } else if (paymentIntent && paymentIntent.status === 'processing') {
      setMessage({ type: 'success', text: 'Payment is processing. We\'ll update you when it\'s complete.' });
      onSuccess?.(paymentIntent.id);
    }

    setIsProcessing(false);
  }, [stripe, elements, returnUrl, onError, onSuccess]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Amount display */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <p className="text-sm text-gray-600">Amount to pay</p>
        <p className="text-3xl font-bold text-gray-900 font-heading tracking-tight">{formatCurrency(amount)}</p>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>

      {/* Payment Element */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Payment Details</label>
        <div className="border border-gray-300 rounded-lg p-4 bg-white">
          <PaymentElement
            onReady={() => setPaymentElementReady(true)}
            options={{
              layout: 'tabs',
            }}
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg',
            message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          )}
        >
          {message.type === 'error' ? (
            <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
          ) : (
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Security note */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <LockClosedIcon className="h-4 w-4" />
        <span>Your payment information is encrypted and secure</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={!stripe || !elements || isProcessing || !paymentElementReady}
          loading={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount)}`}
        </Button>
      </div>
    </form>
  );
}

/**
 * PaymentForm - Stripe payment form with Elements provider
 *
 * Features:
 * - Credit card and ACH support
 * - Real-time validation
 * - Loading states
 * - Error handling
 * - Secure encryption
 */
export default function PaymentForm(props: PaymentFormProps) {
  const { clientSecret, ...innerProps } = props;

  if (!stripePromise) {
    return (
      <div className="text-center py-8">
        <ExclamationCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600">Payment processing is not configured</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#10b981', // brand-primary
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '8px',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner {...innerProps} />
    </Elements>
  );
}

/**
 * PaymentMethodSelector - Simple payment method selection
 */
export function PaymentMethodSelector({
  value,
  onChange,
  className,
}: {
  value: 'card' | 'ach';
  onChange: (method: 'card' | 'ach') => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-3', className)}>
      <button
        type="button"
        onClick={() => onChange('card')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg transition-colors',
          value === 'card'
            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
            : 'border-gray-200 hover:bg-gray-50'
        )}
      >
        <CreditCardIcon className="h-5 w-5" />
        <span className="font-medium">Card</span>
      </button>
      <button
        type="button"
        onClick={() => onChange('ach')}
        className={cn(
          'flex-1 flex items-center justify-center gap-2 p-4 border rounded-lg transition-colors',
          value === 'ach'
            ? 'border-brand-primary bg-brand-primary/5 text-brand-primary'
            : 'border-gray-200 hover:bg-gray-50'
        )}
      >
        <BanknotesIcon className="h-5 w-5" />
        <span className="font-medium">Bank</span>
      </button>
    </div>
  );
}
