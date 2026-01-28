"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Project, ClientPreferences } from '@/types';
import { Button, Card, Input, Textarea, toast } from '@/components/ui';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [prefs, setPrefs] = useState<ClientPreferences>({
    notes: '',
    finishes: {},
    inspirationImageUrls: [],
    budgetRange: '',
    timelinePreference: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
          setPrefs(prefsDoc.data() as ClientPreferences);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
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
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Client Preferences</h1>
      </div>

      {/* Notes */}
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

      {/* Finish Preferences */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Finish Preferences</h2>
        <div className="space-y-4">
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
            placeholder="e.g., Complete by June 2026, flexible on dates"
            value={prefs.timelinePreference || ''}
            onChange={(e) => setPrefs(prev => ({ ...prev, timelinePreference: e.target.value }))}
          />
        </div>
      </Card>

      {/* Inspiration Images (URLs for now) */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-4">Inspiration</h2>
        <Textarea
          label="Inspiration Image URLs"
          placeholder="Paste URLs to Pinterest pins, Houzz photos, etc. (one per line)"
          value={(prefs.inspirationImageUrls || []).join('\n')}
          onChange={(e) => setPrefs(prev => ({
            ...prev,
            inspirationImageUrls: e.target.value.split('\n').filter(Boolean),
          }))}
          rows={4}
        />
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} loading={saving}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
