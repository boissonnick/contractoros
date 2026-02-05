"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db, storage } from '@/lib/firebase/config';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Card, Avatar } from '@/components/ui';
import { FormInput, FormSelect } from '@/components/ui/FormField';
import { toast } from '@/components/ui/Toast';
import { compressImageFile, PROFILE_PHOTO_OPTIONS, validateImageFile } from '@/lib/utils/imageOptimization';
import {
  CameraIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().optional(),
  trade: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  timezone: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const TIMEZONE_OPTIONS = [
  { value: '', label: 'Auto-detect' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (International)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12-hour (2:30 PM)' },
  { value: '24h', label: '24-hour (14:30)' },
];

const TRADE_OPTIONS = [
  { value: '', label: 'Select your trade...' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'hvac', label: 'HVAC Technician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'painter', label: 'Painter' },
  { value: 'mason', label: 'Mason' },
  { value: 'landscaper', label: 'Landscaper' },
  { value: 'flooring', label: 'Flooring Specialist' },
  { value: 'drywall', label: 'Drywall Installer' },
  { value: 'tile', label: 'Tile Setter' },
  { value: 'concrete', label: 'Concrete Worker' },
  { value: 'framer', label: 'Framer' },
  { value: 'insulation', label: 'Insulation Installer' },
  { value: 'siding', label: 'Siding Installer' },
  { value: 'window_door', label: 'Window/Door Installer' },
  { value: 'cabinet', label: 'Cabinet Maker' },
  { value: 'other', label: 'Other' },
];

export default function ProfileSettingsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      trade: '',
      bio: '',
      timezone: '',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
    },
  });

  // Load profile data into form
  useEffect(() => {
    if (profile && user) {
      reset({
        displayName: profile.displayName || '',
        email: user.email || '',
        phone: profile.phone || '',
        trade: profile.trade || '',
        bio: profile.bio || '',
        timezone: profile.timezone || '',
        dateFormat: profile.dateFormat || 'MM/DD/YYYY',
        timeFormat: profile.timeFormat || '12h',
      });
      if (profile.photoURL) {
        setPhotoPreview(profile.photoURL);
      }
    }
  }, [profile, user, reset]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validation = validateImageFile(file, 5);
    if (!validation.isValid) {
      toast.error('Invalid file', validation.error);
      return;
    }

    setPhotoUploading(true);

    try {
      // Show preview immediately
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);

      // Compress and upload
      const compressedFile = await compressImageFile(file, PROFILE_PHOTO_OPTIONS);
      const photoRef = ref(storage, `users/${user.uid}/profile.jpg`);
      await uploadBytes(photoRef, compressedFile);
      const photoURL = await getDownloadURL(photoRef);

      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: Timestamp.now(),
      });

      // Update Firebase Auth profile
      await updateProfile(user, { photoURL });

      toast.success('Photo updated');
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
      setPhotoPreview(profile?.photoURL || null);
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: null,
        updatedAt: Timestamp.now(),
      });
      await updateProfile(user, { photoURL: '' });
      setPhotoPreview(null);
      toast.success('Photo removed');
    } catch (error) {
      console.error('Remove photo error:', error);
      toast.error('Failed to remove photo');
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      // Update Firestore profile
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: data.displayName,
        phone: data.phone || null,
        trade: data.trade || null,
        bio: data.bio || null,
        timezone: data.timezone || null,
        dateFormat: data.dateFormat || 'MM/DD/YYYY',
        timeFormat: data.timeFormat || '12h',
        updatedAt: Timestamp.now(),
      });

      // Update Firebase Auth display name
      await updateProfile(user, { displayName: data.displayName });

      // Note: Email update requires re-authentication - skipping for simplicity
      // In production, you'd want a separate flow for email changes

      toast.success('Profile updated');
      reset(data); // Reset form state to mark as not dirty
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile', error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Photo */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar
              name={profile?.displayName || ''}
              src={photoPreview || undefined}
              size="xl"
            />
            {photoUploading && (
              <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={photoUploading}
                icon={<CameraIcon className="h-4 w-4" />}
              >
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              {photoPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  icon={<TrashIcon className="h-4 w-4" />}
                >
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">
              JPG, PNG or WebP. Max 5MB. Recommended size: 400×400px.
            </p>
          </div>
        </div>
      </Card>

      {/* Profile Information */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="displayName"
              register={register}
              label="Full Name"
              placeholder="John Smith"
              error={errors.displayName}
              required
            />
            <FormInput
              name="email"
              register={register}
              label="Email Address"
              type="email"
              placeholder="john@company.com"
              error={errors.email}
              disabled // Email changes require re-auth
              hint="Contact support to change your email"
            />
            <FormInput
              name="phone"
              register={register}
              label="Phone Number"
              type="tel"
              placeholder="(512) 555-1234"
              error={errors.phone}
            />
            <FormSelect
              name="trade"
              register={register}
              label="Primary Trade"
              options={TRADE_OPTIONS}
              error={errors.trade}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              {...register('bio')}
              rows={3}
              placeholder="Tell us a bit about yourself..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-vertical"
              maxLength={500}
            />
            {errors.bio && (
              <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">Max 500 characters</p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!isDirty}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Regional Preferences */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Regional Preferences</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              name="timezone"
              register={register}
              label="Timezone"
              options={TIMEZONE_OPTIONS}
              error={errors.timezone}
            />
            <FormSelect
              name="dateFormat"
              register={register}
              label="Date Format"
              options={DATE_FORMAT_OPTIONS}
              error={errors.dateFormat}
            />
            <FormSelect
              name="timeFormat"
              register={register}
              label="Time Format"
              options={TIME_FORMAT_OPTIONS}
              error={errors.timeFormat}
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              disabled={!isDirty}
            >
              Save Preferences
            </Button>
          </div>
        </form>
      </Card>

      {/* Account Security */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Password</h3>
              <p className="text-sm text-gray-500">
                Change your account password
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/auth/change-password')}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Coming Soon
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Danger Zone</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
              disabled
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
