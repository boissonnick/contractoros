"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PaymentLink } from '@/types';
import PaymentForm from '@/components/payments/PaymentForm';
import { formatCurrency, isPaymentLinkExpired } from '@/lib/payments/paymentUtils';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

type PageStatus = 'loading' | 'valid' | 'expired' | 'used' | 'cancelled' | 'not_found' | 'error' | 'success';

export default function PublicPaymentPage() {
  const params = useParams();
  const _router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<PageStatus>('loading');
  const [paymentLink, setPaymentLink] = useState<PaymentLink | null>(null);
  const [orgInfo, setOrgInfo] = useState<{ name: string; logo?: string } | null>(null);
  const [invoiceInfo, setInvoiceInfo] = useState<{ number?: string; description?: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch payment link data
  useEffect(() => {
    async function fetchPaymentLink() {
      if (!token) {
        setStatus('not_found');
        return;
      }

      try {
        // Find payment link by token
        const response = await fetch(`/api/payments/link?token=${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setStatus('not_found');
          } else {
            setStatus('error');
            setErrorMessage('Failed to load payment information');
          }
          return;
        }

        const data = await response.json();
        const link = data.paymentLink as PaymentLink;

        // Check if expired
        if (isPaymentLinkExpired(link.expiresAt)) {
          setStatus('expired');
          return;
        }

        // Check if already used
        if (link.status === 'used') {
          setStatus('used');
          return;
        }

        // Check if cancelled
        if (link.status === 'cancelled') {
          setStatus('cancelled');
          return;
        }

        setPaymentLink(link);

        // Fetch org info
        if (data.org) {
          setOrgInfo(data.org);
        }

        // Fetch invoice info
        if (data.invoice) {
          setInvoiceInfo(data.invoice);
        }

        setStatus('valid');
      } catch (error) {
        console.error('Error fetching payment link:', error);
        setStatus('error');
        setErrorMessage('Failed to load payment information');
      }
    }

    fetchPaymentLink();
  }, [token]);

  // Create payment intent when ready to pay
  const handleInitiatePayment = async () => {
    if (!paymentLink) return;

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: paymentLink.orgId,
          invoiceId: paymentLink.invoiceId,
          projectId: paymentLink.projectId,
          clientId: paymentLink.clientId,
          amount: paymentLink.amount,
          description: invoiceInfo?.description || `Payment for Invoice ${invoiceInfo?.number || ''}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      console.error('Error creating payment:', error);
      setErrorMessage('Failed to initialize payment. Please try again.');
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Mark payment link as used
      await fetch(`/api/payments/link`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          status: 'used',
          paymentId: paymentIntentId,
        }),
      });

      setStatus('success');
    } catch (error) {
      console.error('Error updating payment link:', error);
      // Payment was still successful, just failed to update link status
      setStatus('success');
    }
  };

  // Render based on status
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (status === 'not_found') {
    return (
      <ErrorState
        icon={ExclamationCircleIcon}
        title="Payment Link Not Found"
        message="This payment link is invalid or has been removed."
      />
    );
  }

  if (status === 'expired') {
    return (
      <ErrorState
        icon={ClockIcon}
        title="Payment Link Expired"
        message="This payment link has expired. Please contact the contractor for a new payment link."
      />
    );
  }

  if (status === 'used') {
    return (
      <ErrorState
        icon={CheckCircleIcon}
        title="Payment Already Completed"
        message="This payment has already been processed. If you have questions, please contact the contractor."
        iconColor="text-green-500"
      />
    );
  }

  if (status === 'cancelled') {
    return (
      <ErrorState
        icon={ExclamationCircleIcon}
        title="Payment Link Cancelled"
        message="This payment link has been cancelled. Please contact the contractor for assistance."
      />
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        icon={ExclamationCircleIcon}
        title="Something Went Wrong"
        message={errorMessage || 'An error occurred. Please try again later.'}
      />
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-heading tracking-tight mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Your payment of {paymentLink && formatCurrency(paymentLink.amount)} has been processed successfully.
            You will receive a receipt by email.
          </p>
          <p className="text-sm text-gray-500">
            Thank you for your payment. You can close this window.
          </p>
        </div>
      </div>
    );
  }

  // Valid payment link - show payment form
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {orgInfo?.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgInfo.logo}
              alt={orgInfo.name}
              className="h-12 mx-auto mb-4"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <BuildingOffice2Icon className="h-8 w-8 text-gray-500" />
            </div>
          )}
          {orgInfo && (
            <h2 className="text-lg font-medium text-gray-700">{orgInfo.name}</h2>
          )}
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Invoice Info */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Payment for</p>
                <p className="font-medium text-gray-900">
                  {invoiceInfo?.number ? `Invoice #${invoiceInfo.number}` : 'Invoice Payment'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Amount Due</p>
                <p className="text-2xl font-bold text-gray-900 font-heading tracking-tight">
                  {paymentLink && formatCurrency(paymentLink.amount)}
                </p>
              </div>
            </div>
            {invoiceInfo?.description && (
              <p className="text-sm text-gray-500 mt-2">{invoiceInfo.description}</p>
            )}
          </div>

          {/* Payment Form or Initiate Button */}
          <div className="p-6">
            {clientSecret ? (
              <PaymentForm
                clientSecret={clientSecret}
                amount={paymentLink?.amount || 0}
                description={invoiceInfo?.description}
                onSuccess={handlePaymentSuccess}
                onError={(error) => setErrorMessage(error)}
                returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/pay/${token}/success`}
              />
            ) : (
              <div className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {errorMessage}
                  </div>
                )}
                <button
                  onClick={handleInitiatePayment}
                  className="w-full py-4 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-dark transition-colors"
                >
                  Continue to Payment
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Stripe
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-8">
          Link expires {paymentLink?.expiresAt && new Date(paymentLink.expiresAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({
  icon: Icon,
  title,
  message,
  iconColor = 'text-red-500',
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  iconColor?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
          iconColor === 'text-green-500' ? 'bg-green-100' : 'bg-red-100'
        }`}>
          <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
        <h1 className="text-xl font-bold text-gray-900 font-heading tracking-tight mb-2">{title}</h1>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
