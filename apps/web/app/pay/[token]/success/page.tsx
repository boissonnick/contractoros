"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

export default function PaymentSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    async function updatePaymentLink() {
      if (redirectStatus === 'succeeded' && paymentIntentId) {
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
          logger.error('Error updating payment link', { error: error, page: 'pay-token-success' });
          // Payment was still successful, just failed to update link status
          setStatus('success');
        }
      } else if (redirectStatus === 'failed') {
        setStatus('failed');
      } else {
        // If no redirect_status, assume success since we're on this page
        setStatus('success');
      }
    }

    updatePaymentLink();
  }, [token, paymentIntentId, redirectStatus]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4" />
          <p className="text-gray-600">Confirming payment...</p>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Your payment could not be processed. Please try again or contact support.
          </p>
          <a
            href={`/pay/${token}`}
            className="inline-block px-6 py-3 bg-brand-primary text-white font-medium rounded-lg hover:bg-brand-primary-dark transition-colors"
          >
            Try Again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircleIcon className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. You will receive a receipt by email.
        </p>
        <p className="text-sm text-gray-500">
          Thank you for your payment. You can close this window.
        </p>
      </div>
    </div>
  );
}
