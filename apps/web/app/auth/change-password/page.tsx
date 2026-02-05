"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card } from '@/components/ui';
import { FormInput } from '@/components/ui/FormField';
import { toast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import {
  LockClosedIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ['newPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!user || !user.email) {
      toast.error('Not authenticated', 'Please sign in again');
      router.push('/login');
      return;
    }

    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, data.newPassword);

      setSuccess(true);
      toast.success('Password updated', 'Your password has been changed successfully');
    } catch (error: any) {
      console.error('Change password error:', error);

      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Incorrect password', 'Your current password is incorrect');
      } else if (error.code === 'auth/requires-recent-login') {
        toast.error('Session expired', 'Please sign out and sign in again');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Weak password', 'Please choose a stronger password');
      } else {
        toast.error('Failed to change password', 'Please try again later');
      }
    }
  };

  if (success) {
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
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Password Changed</h2>
            <p className="text-gray-500 mb-6">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>

            <Link href="/dashboard/settings">
              <Button variant="primary" className="w-full">
                Back to Settings
              </Button>
            </Link>
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
          <p className="text-blue-200 mt-2">Change your password</p>
        </div>

        <Card>
          <div className="mb-6">
            <Link
              href="/dashboard/settings/profile"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to profile
            </Link>
          </div>

          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <LockClosedIcon className="h-6 w-6 text-blue-600" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Change Password
          </h2>
          <p className="text-gray-500 mb-6">
            Enter your current password and choose a new one.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormInput
              name="currentPassword"
              register={register}
              label="Current Password"
              type="password"
              placeholder="Enter your current password"
              error={errors.currentPassword}
              required
            />

            <div className="border-t border-gray-200 pt-4">
              <FormInput
                name="newPassword"
                register={register}
                label="New Password"
                type="password"
                placeholder="Enter your new password"
                error={errors.newPassword}
                required
              />

              {/* Password requirements */}
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 w-3 text-gray-400" />
                    At least 8 characters
                  </li>
                  <li className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 w-3 text-gray-400" />
                    One uppercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 w-3 text-gray-400" />
                    One lowercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-3 w-3 text-gray-400" />
                    One number
                  </li>
                </ul>
              </div>
            </div>

            <FormInput
              name="confirmPassword"
              register={register}
              label="Confirm New Password"
              type="password"
              placeholder="Confirm your new password"
              error={errors.confirmPassword}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={isSubmitting}
            >
              Change Password
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Forgot your password?{' '}
              <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-700">
                Reset it
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
