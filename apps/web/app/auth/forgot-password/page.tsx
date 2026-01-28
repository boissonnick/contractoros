"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/lib/validations';
import { Button, Card } from '@/components/ui';
import { FormInput } from '@/components/ui/FormField';
import { toast } from '@/components/ui/Toast';
import {
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await sendPasswordResetEmail(auth, data.email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
      setSentEmail(data.email);
      setEmailSent(true);
      toast.success('Reset email sent', 'Check your inbox for the password reset link');
    } catch (error: any) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists for security
        setSentEmail(data.email);
        setEmailSent(true);
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Too many requests', 'Please wait a few minutes before trying again');
      } else {
        toast.error('Failed to send reset email', 'Please try again later');
      }
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
          </div>

          <Card className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 mb-2">
              We sent a password reset link to:
            </p>
            <p className="font-medium text-gray-900 mb-4">{sentEmail}</p>
            <p className="text-sm text-gray-400 mb-6">
              Click the link in the email to reset your password. The link expires in 1 hour.
            </p>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setEmailSent(false)}
              >
                Try a different email
              </Button>
              <Link href="/login" className="block">
                <Button variant="primary" className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ContractorOS</h1>
          <p className="text-blue-200 mt-2">Reset your password</p>
        </div>

        <Card>
          <div className="mb-6">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>

          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <EnvelopeIcon className="h-6 w-6 text-blue-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Forgot your password?
          </h2>
          <p className="text-gray-500 mb-6">
            No worries! Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              name="email"
              register={register}
              label="Email address"
              type="email"
              placeholder="you@company.com"
              error={errors.email}
              autoFocus
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
