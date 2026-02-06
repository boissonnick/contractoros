"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { ClientPreferences } from '@/types';
import { Button, Card, Input, Textarea, toast } from '@/components/ui';
import ImageUploader from '@/components/projects/ImageUploader';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const FINISH_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: 'flooring', label: 'Flooring', placeholder: 'e.g., Hardwood, tile, LVP...' },
  { key: 'countertops', label: 'Countertops', placeholder: 'e.g., Quartz, granite, marble...' },
  { key: 'cabinetry', label: 'Cabinetry', placeholder: 'e.g., Shaker, flat-panel, custom...' },
  { key: 'fixtures', label: 'Fixtures', placeholder: 'e.g., Brushed nickel, matte black...' },
  { key: 'paint', label: 'Paint', placeholder: 'e.g., Benjamin Moore White Dove...' },
];

export default function ClientPreferencesOnboarding() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState<ClientPreferences>({
    notes: '',
    finishes: {},
    inspirationImages: [],
    budgetRange: '',
    timelinePreference: '',
  });

  useEffect(() => {
    async function validateToken() {
      try {
        const q = query(
          collection(db, 'clientOnboardingTokens'),
          where('token', '==', token)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setError('This link is invalid or has expired.');
          setLoading(false);
          return;
        }

        const tokenDoc = snap.docs[0].data();
        const expiresAt = tokenDoc.expiresAt?.toDate();
        if (tokenDoc.used) {
          setError('This link has already been used.');
          setLoading(false);
          return;
        }
        if (expiresAt && expiresAt < new Date()) {
          setError('This link has expired. Please ask your contractor for a new one.');
          setLoading(false);
          return;
        }

        setProjectId(tokenDoc.projectId);

        // Fetch project name
        const projectDoc = await getDoc(doc(db, 'projects', tokenDoc.projectId));
        if (projectDoc.exists()) {
          setProjectName(projectDoc.data().name || 'Your Project');
        }

        // Load existing preferences
        const prefsDoc = await getDoc(
          doc(db, 'projects', tokenDoc.projectId, 'clientPreferences', 'main')
        );
        if (prefsDoc.exists()) {
          const data = prefsDoc.data() as ClientPreferences;
          setPrefs({
            ...data,
            inspirationImages: data.inspirationImages || [],
          });
        }
      } catch (err) {
        console.error('Error validating token:', err);
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    validateToken();
  }, [token]);

  const updateFinish = (key: string, value: string) => {
    setPrefs((prev) => ({
      ...prev,
      finishes: { ...prev.finishes, [key]: value },
    }));
  };

  const handleSubmit = async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'projects', projectId, 'clientPreferences', 'main'), {
        ...prefs,
        updatedAt: Timestamp.now(),
        submittedByClient: true,
      });

      // Mark token as used
      const q = query(
        collection(db, 'clientOnboardingTokens'),
        where('token', '==', token)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, { used: true });
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Link Error</h1>
          <p className="text-gray-600">{error}</p>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Thank You!</h1>
          <p className="text-gray-600">
            Your preferences have been submitted. Your contractor will review them shortly.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Your Project Preferences</h1>
          <p className="text-gray-500 mt-1">{projectName}</p>
          <p className="text-sm text-gray-400 mt-2">
            Help your contractor understand your vision by filling out your preferences below.
          </p>
        </div>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">General Notes</h2>
          <Textarea
            label="Any special requests or requirements?"
            placeholder="Tell us about your vision, must-haves, or concerns..."
            value={prefs.notes || ''}
            onChange={(e) => setPrefs((prev) => ({ ...prev, notes: e.target.value }))}
            rows={4}
          />
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Finish Preferences</h2>
          <div className="space-y-4">
            {FINISH_FIELDS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                placeholder={placeholder}
                value={prefs.finishes?.[key as keyof typeof prefs.finishes] || ''}
                onChange={(e) => updateFinish(key, e.target.value)}
              />
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold text-gray-900 mb-4">Budget & Timeline</h2>
          <div className="space-y-4">
            <Input
              label="Budget Range"
              placeholder="e.g., $30,000 - $50,000"
              value={prefs.budgetRange || ''}
              onChange={(e) => setPrefs((prev) => ({ ...prev, budgetRange: e.target.value }))}
            />
            <Input
              label="Timeline Preference"
              placeholder="e.g., Complete by June 2026, flexible on dates"
              value={prefs.timelinePreference || ''}
              onChange={(e) =>
                setPrefs((prev) => ({ ...prev, timelinePreference: e.target.value }))
              }
            />
          </div>
        </Card>

        {projectId && (
          <Card>
            <h2 className="font-semibold text-gray-900 mb-4">Inspiration Images</h2>
            <ImageUploader
              images={prefs.inspirationImages || []}
              onImagesChange={(imgs) =>
                setPrefs((prev) => ({ ...prev, inspirationImages: imgs }))
              }
              projectId={projectId}
            />
          </Card>
        )}

        <div className="flex justify-end pb-8">
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            Submit Preferences
          </Button>
        </div>
      </div>
    </div>
  );
}
