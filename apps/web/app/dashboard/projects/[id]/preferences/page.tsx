"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { Project, ClientPreferences } from '@/types';
import { Button, Card, Input, Textarea, toast } from '@/components/ui';
import ImageUploader from '@/components/projects/ImageUploader';
import {
  LinkIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { logger } from '@/lib/utils/logger';

const FINISH_FIELDS: { key: keyof NonNullable<ClientPreferences['finishes']>; label: string; placeholder: string }[] = [
  { key: 'flooring', label: 'Flooring', placeholder: 'e.g., Hardwood, tile, LVP...' },
  { key: 'countertops', label: 'Countertops', placeholder: 'e.g., Quartz, granite, marble...' },
  { key: 'cabinetry', label: 'Cabinetry', placeholder: 'e.g., Shaker, flat-panel, custom...' },
  { key: 'fixtures', label: 'Fixtures', placeholder: 'e.g., Brushed nickel, matte black...' },
  { key: 'paint', label: 'Paint', placeholder: 'e.g., Benjamin Moore White Dove...' },
];

export default function ClientPreferencesPage() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [prefs, setPrefs] = useState<ClientPreferences>({
    notes: '',
    finishes: {},
    inspirationImageUrls: [],
    inspirationImages: [],
    budgetRange: '',
    timelinePreference: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const projectDoc = await getDoc(doc(db, 'projects', projectId));
        if (!projectDoc.exists()) {
          router.push('/dashboard/projects');
          return;
        }
        setProject({ id: projectDoc.id, ...projectDoc.data() } as Project);

        const prefsDoc = await getDoc(doc(db, 'projects', projectId, 'clientPreferences', 'main'));
        if (prefsDoc.exists()) {
          const data = prefsDoc.data() as ClientPreferences;
          setPrefs({
            ...data,
            inspirationImages: data.inspirationImages || [],
          });
        }
      } catch (error) {
        logger.error('Error fetching preferences', { error, page: 'project-preferences' });
        toast.error('Failed to load preferences');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [projectId, router]);

  const updateFinish = (key: string, value: string) => {
    setPrefs(prev => ({
      ...prev,
      finishes: { ...prev.finishes, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'projects', projectId, 'clientPreferences', 'main'), {
        ...prefs,
        updatedAt: Timestamp.now(),
      });
      toast.success('Preferences saved');
    } catch (error) {
      logger.error('Error saving preferences', { error, page: 'project-preferences' });
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateClientLink = async () => {
    if (!profile?.orgId) return;
    setGeneratingLink(true);
    try {
      const token = crypto.randomUUID();
      await addDoc(collection(db, 'clientOnboardingTokens'), {
        token,
        projectId,
        clientId: project?.clientId || '',
        orgId: profile.orgId,
        createdAt: Timestamp.now(),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        used: false,
      });

      const link = `${window.location.origin}/onboarding/preferences/${token}`;
      await navigator.clipboard.writeText(link);
      toast.success('Client onboarding link copied to clipboard! Valid for 7 days.');
    } catch (error) {
      logger.error('Error generating link', { error, page: 'project-preferences' });
      toast.error('Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Client Preferences</h1>
          <p className="text-sm text-gray-500 mt-1">
            Capture and manage client design and budget preferences
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerateClientLink}
          loading={generatingLink}
          icon={<LinkIcon className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Send to Client
        </Button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <EnvelopeIcon className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Collect preferences from your client</p>
          <p className="mt-1">
            Generate a link your client can use to fill out their preferences directly. Valid for 7 days.
          </p>
        </div>
      </div>

      {/* Main content - responsive 2-column grid for better balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Notes */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">General Notes</h2>
          <Textarea
            label="Notes from client"
            placeholder="Any special requests, considerations, or requirements..."
            value={prefs.notes || ''}
            onChange={(e) => setPrefs(prev => ({ ...prev, notes: e.target.value }))}
            rows={4}
          />
        </Card>

        {/* Budget & Timeline */}
        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Budget & Timeline</h2>
          <div className="space-y-4">
            <Input
              label="Budget Range"
              placeholder="e.g., $30,000 - $50,000"
              value={prefs.budgetRange || ''}
              onChange={(e) => setPrefs(prev => ({ ...prev, budgetRange: e.target.value }))}
            />
            <Input
              label="Timeline Preference"
              placeholder="e.g., Complete by June 2026"
              value={prefs.timelinePreference || ''}
              onChange={(e) => setPrefs(prev => ({ ...prev, timelinePreference: e.target.value }))}
            />
          </div>
        </Card>

        {/* Finish Preferences - full width with internal 2-column layout */}
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Design & Finishes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FINISH_FIELDS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                placeholder={placeholder}
                value={prefs.finishes?.[key] || ''}
                onChange={(e) => updateFinish(key, e.target.value)}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Inspiration Images - full width */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Inspiration Images</h2>
        <ImageUploader
          images={prefs.inspirationImages || []}
          onImagesChange={(imgs) => setPrefs(prev => ({ ...prev, inspirationImages: imgs }))}
          projectId={projectId}
        />
      </Card>

      {/* Save - sticky on mobile (bottom-16 = 64px for bottom nav) */}
      <div className="flex justify-end sticky bottom-16 sm:static bg-gray-50 sm:bg-transparent -mx-4 px-4 py-4 sm:py-0 sm:mx-0 border-t sm:border-t-0 border-gray-200">
        <Button variant="primary" onClick={handleSave} loading={saving} className="w-full sm:w-auto">
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
