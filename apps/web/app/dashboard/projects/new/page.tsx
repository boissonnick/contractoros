"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ensurePhaseTemplates } from '@/lib/firebase/seedTemplates';
import { Button, Input, Textarea, Card, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { PhaseTemplate } from '@/types';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  HomeModernIcon,
  BuildingStorefrontIcon,
  PuzzlePieceIcon,
} from '@heroicons/react/24/outline';

import { SparklesIcon } from '@heroicons/react/24/outline';

type Step = 'basics' | 'scope' | 'address' | 'client' | 'preferences' | 'budget' | 'review';

const steps: { id: Step; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'basics', title: 'Project Info', icon: BuildingOfficeIcon },
  { id: 'scope', title: 'Scope', icon: WrenchScrewdriverIcon },
  { id: 'address', title: 'Location', icon: MapPinIcon },
  { id: 'client', title: 'Client', icon: UserIcon },
  { id: 'preferences', title: 'Preferences', icon: SparklesIcon },
  { id: 'budget', title: 'Budget & Dates', icon: CurrencyDollarIcon },
  { id: 'review', title: 'Review', icon: CheckCircleIcon },
];

const SCOPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  single_room: HomeIcon,
  addition: BuildingStorefrontIcon,
  full_renovation: HomeModernIcon,
  new_construction: BuildingOfficeIcon,
};

interface ProjectForm {
  name: string;
  description: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  budget: string;
  startDate: string;
  estimatedEndDate: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<PhaseTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [form, setForm] = useState<ProjectForm>({
    name: '',
    description: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    budget: '',
    startDate: '',
    estimatedEndDate: '',
  });
  const [preferences, setPreferences] = useState({
    finishSelections: '',
    budgetRange: '',
    timelinePreference: '',
    specialRequests: '',
    sendOnboardingLink: false,
  });

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Load templates when we reach the scope step
  useEffect(() => {
    if (currentStep === 'scope' && templates.length === 0 && profile?.orgId) {
      setLoadingTemplates(true);
      ensurePhaseTemplates(profile.orgId)
        .then(setTemplates)
        .catch((err) => {
          console.error('Failed to load templates:', err);
          toast.error('Failed to load project templates');
        })
        .finally(() => setLoadingTemplates(false));
    }
  }, [currentStep, templates.length, profile?.orgId]);

  const updateForm = (field: keyof ProjectForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return form.name.trim().length > 0;
      case 'scope':
        return selectedTemplateId !== null;
      case 'address':
        return form.street && form.city && form.state && form.zip;
      case 'client':
        return form.clientName && form.clientEmail;
      case 'preferences':
        return true;
      case 'budget':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.orgId || !user?.uid || !selectedTemplate) return;

    setSaving(true);
    try {
      // Create client user
      const clientRef = await addDoc(collection(db, 'users'), {
        email: form.clientEmail,
        displayName: form.clientName,
        phone: form.clientPhone,
        role: 'CLIENT',
        orgId: profile.orgId,
        isActive: true,
        createdAt: Timestamp.now(),
      });

      // Create project
      const projectRef = await addDoc(collection(db, 'projects'), {
        orgId: profile.orgId,
        name: form.name,
        description: form.description,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          zip: form.zip,
        },
        status: 'lead',
        scope: selectedTemplate.scopeType,
        templateId: selectedTemplate.id,
        clientId: clientRef.id,
        pmId: user.uid,
        budget: form.budget ? parseFloat(form.budget) : null,
        startDate: form.startDate ? Timestamp.fromDate(new Date(form.startDate)) : null,
        estimatedEndDate: form.estimatedEndDate ? Timestamp.fromDate(new Date(form.estimatedEndDate)) : null,
        quoteTotal: null,
        createdAt: Timestamp.now(),
      });

      // Create phase subcollection docs from template
      const phasesRef = collection(db, 'projects', projectRef.id, 'phases');
      for (const phase of selectedTemplate.phases) {
        await addDoc(phasesRef, {
          projectId: projectRef.id,
          name: phase.name,
          order: phase.order,
          status: 'upcoming',
          createdAt: Timestamp.now(),
        });
      }

      // Create client preferences doc if any preferences were set
      if (preferences.finishSelections || preferences.budgetRange || preferences.timelinePreference || preferences.specialRequests) {
        await addDoc(collection(db, 'projects', projectRef.id, 'clientPreferences'), {
          projectId: projectRef.id,
          finishSelections: preferences.finishSelections || null,
          budgetRange: preferences.budgetRange || null,
          timelinePreference: preferences.timelinePreference || null,
          specialRequests: preferences.specialRequests || null,
          inspirationImages: [],
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }

      // Create onboarding token if requested
      if (preferences.sendOnboardingLink && form.clientEmail) {
        await addDoc(collection(db, 'clientOnboardingTokens'), {
          projectId: projectRef.id,
          clientEmail: form.clientEmail,
          orgId: profile.orgId,
          used: false,
          createdAt: Timestamp.now(),
        });
      }

      router.push(`/dashboard/projects/${projectRef.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Projects
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
        <p className="text-gray-500 mt-1">Set up a new job in a few simple steps</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = step.id === currentStep;
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                      isComplete ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className={cn(
                    'mt-2 text-xs font-medium hidden sm:block',
                    isCurrent ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'flex-1 h-1 mx-2 rounded',
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <Card className="mb-6">
        {currentStep === 'basics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h2>
              <p className="text-sm text-gray-500 mb-6">What should we call this project?</p>
            </div>
            <Input
              label="Project Name"
              placeholder="e.g., Smith Kitchen Remodel"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              autoFocus
            />
            <Textarea
              label="Description (optional)"
              placeholder="Brief description of the project scope..."
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={3}
            />
          </div>
        )}

        {currentStep === 'scope' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Scope</h2>
              <p className="text-sm text-gray-500 mb-6">What type of project is this? This determines the default phases.</p>
            </div>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {templates.map((tmpl) => {
                  const Icon = SCOPE_ICONS[tmpl.scopeType] || PuzzlePieceIcon;
                  const isSelected = selectedTemplateId === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => setSelectedTemplateId(tmpl.id)}
                      className={cn(
                        'p-4 rounded-lg border-2 text-left transition-all hover:shadow-md',
                        isSelected
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Icon className={cn('h-8 w-8 mb-3', isSelected ? 'text-blue-600' : 'text-gray-400')} />
                      <h3 className={cn('font-semibold text-sm', isSelected ? 'text-blue-900' : 'text-gray-900')}>
                        {tmpl.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {tmpl.phases.length} phases: {tmpl.phases.map(p => p.name).join(' → ')}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {currentStep === 'address' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Location</h2>
              <p className="text-sm text-gray-500 mb-6">Where is this project located?</p>
            </div>
            <AddressAutocomplete
              value={form.street}
              onChange={(val) => updateForm('street', val)}
              onAddressSelect={(addr) => {
                setForm(prev => ({
                  ...prev,
                  street: addr.street,
                  city: addr.city,
                  state: addr.state,
                  zip: addr.zip,
                }));
              }}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="City"
                placeholder="Austin"
                value={form.city}
                onChange={(e) => updateForm('city', e.target.value)}
              />
              <Input
                label="State"
                placeholder="TX"
                value={form.state}
                onChange={(e) => updateForm('state', e.target.value)}
              />
            </div>
            <Input
              label="ZIP Code"
              placeholder="78701"
              value={form.zip}
              onChange={(e) => updateForm('zip', e.target.value)}
            />
          </div>
        )}

        {currentStep === 'client' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
              <p className="text-sm text-gray-500 mb-6">Who is the homeowner/client for this project?</p>
            </div>
            <Input
              label="Client Name"
              placeholder="John Smith"
              value={form.clientName}
              onChange={(e) => updateForm('clientName', e.target.value)}
              autoFocus
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={form.clientEmail}
              onChange={(e) => updateForm('clientEmail', e.target.value)}
            />
            <Input
              label="Phone (optional)"
              type="tel"
              placeholder="(512) 555-1234"
              value={form.clientPhone}
              onChange={(e) => updateForm('clientPhone', e.target.value)}
            />
          </div>
        )}

        {currentStep === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Preferences</h2>
              <p className="text-sm text-gray-500 mb-6">Capture the client&apos;s style and finish preferences (optional — can be filled later)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Finish Selections</label>
              <select
                value={preferences.finishSelections}
                onChange={(e) => setPreferences(p => ({ ...p, finishSelections: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Not specified</option>
                <option value="builder_grade">Builder Grade</option>
                <option value="mid_range">Mid-Range</option>
                <option value="high_end">High-End</option>
                <option value="luxury">Luxury</option>
                <option value="custom">Custom / Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget Range Expectation</label>
              <select
                value={preferences.budgetRange}
                onChange={(e) => setPreferences(p => ({ ...p, budgetRange: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Not specified</option>
                <option value="under_25k">Under $25K</option>
                <option value="25k_50k">$25K – $50K</option>
                <option value="50k_100k">$50K – $100K</option>
                <option value="100k_250k">$100K – $250K</option>
                <option value="250k_plus">$250K+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeline Preference</label>
              <select
                value={preferences.timelinePreference}
                onChange={(e) => setPreferences(p => ({ ...p, timelinePreference: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Not specified</option>
                <option value="asap">ASAP</option>
                <option value="flexible">Flexible</option>
                <option value="specific_date">Specific target date</option>
              </select>
            </div>
            <Textarea
              label="Special Requests / Notes"
              placeholder="Any specific materials, brands, or design preferences..."
              value={preferences.specialRequests}
              onChange={(e) => setPreferences(p => ({ ...p, specialRequests: e.target.value }))}
              rows={3}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.sendOnboardingLink}
                onChange={(e) => setPreferences(p => ({ ...p, sendOnboardingLink: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">Send preferences onboarding link to client after creation</span>
            </label>
          </div>
        )}

        {currentStep === 'budget' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Budget & Timeline</h2>
              <p className="text-sm text-gray-500 mb-6">Set the financial and schedule parameters (all optional)</p>
            </div>
            <Input
              label="Budget"
              type="number"
              placeholder="50000"
              value={form.budget}
              onChange={(e) => updateForm('budget', e.target.value)}
              icon={<span className="text-gray-400">$</span>}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={form.startDate}
                onChange={(e) => updateForm('startDate', e.target.value)}
              />
              <Input
                label="Target End Date"
                type="date"
                value={form.estimatedEndDate}
                onChange={(e) => updateForm('estimatedEndDate', e.target.value)}
              />
            </div>
          </div>
        )}

        {currentStep === 'review' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Create</h2>
              <p className="text-sm text-gray-500 mb-6">Make sure everything looks good</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Project</h3>
                <p className="font-semibold text-gray-900">{form.name}</p>
                {form.description && <p className="text-sm text-gray-600 mt-1">{form.description}</p>}
              </div>

              {selectedTemplate && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Scope</h3>
                  <p className="font-semibold text-gray-900">{selectedTemplate.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedTemplate.phases.map(p => p.name).join(' → ')}
                  </p>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Location</h3>
                <p className="text-gray-900">{form.street}</p>
                <p className="text-gray-600">{form.city}, {form.state} {form.zip}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Client</h3>
                <p className="font-medium text-gray-900">{form.clientName}</p>
                <p className="text-sm text-gray-600">{form.clientEmail}</p>
                {form.clientPhone && <p className="text-sm text-gray-600">{form.clientPhone}</p>}
              </div>

              {(preferences.finishSelections || preferences.budgetRange || preferences.timelinePreference || preferences.specialRequests) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Preferences</h3>
                  {preferences.finishSelections && <p className="text-sm text-gray-600">Finish: {preferences.finishSelections.replace(/_/g, ' ')}</p>}
                  {preferences.budgetRange && <p className="text-sm text-gray-600">Budget range: {preferences.budgetRange.replace(/_/g, ' ')}</p>}
                  {preferences.timelinePreference && <p className="text-sm text-gray-600">Timeline: {preferences.timelinePreference.replace(/_/g, ' ')}</p>}
                  {preferences.specialRequests && <p className="text-sm text-gray-600">Notes: {preferences.specialRequests}</p>}
                  {preferences.sendOnboardingLink && <p className="text-xs text-blue-600 mt-1">Client onboarding link will be sent</p>}
                </div>
              )}

              {(form.budget || form.startDate || form.estimatedEndDate) && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Budget & Timeline</h3>
                  {form.budget && <p className="text-gray-900">Budget: ${parseFloat(form.budget).toLocaleString()}</p>}
                  {form.startDate && <p className="text-sm text-gray-600">Start: {new Date(form.startDate).toLocaleDateString()}</p>}
                  {form.estimatedEndDate && <p className="text-sm text-gray-600">Target End: {new Date(form.estimatedEndDate).toLocaleDateString()}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStepIndex === 0}
          icon={<ArrowLeftIcon className="h-4 w-4" />}
        >
          Back
        </Button>

        {currentStep === 'review' ? (
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={saving}
            icon={<CheckCircleIcon className="h-4 w-4" />}
            iconPosition="right"
          >
            Create Project
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={goNext}
            disabled={!canProceed()}
            icon={<ArrowRightIcon className="h-4 w-4" />}
            iconPosition="right"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
