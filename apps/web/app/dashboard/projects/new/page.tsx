"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Button, Input, Textarea, Select, Card } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  BuildingOfficeIcon,
  MapPinIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

type Step = 'basics' | 'address' | 'client' | 'budget' | 'review';

const steps: { id: Step; title: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'basics', title: 'Project Info', icon: BuildingOfficeIcon },
  { id: 'address', title: 'Location', icon: MapPinIcon },
  { id: 'client', title: 'Client', icon: UserIcon },
  { id: 'budget', title: 'Budget & Dates', icon: CurrencyDollarIcon },
  { id: 'review', title: 'Review', icon: CheckCircleIcon },
];

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
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('basics');
  const [saving, setSaving] = useState(false);
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

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateForm = (field: keyof ProjectForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'basics':
        return form.name.trim().length > 0;
      case 'address':
        return form.street && form.city && form.state && form.zip;
      case 'client':
        return form.clientName && form.clientEmail;
      case 'budget':
        return true; // Optional
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
    if (!profile?.orgId) return;

    setSaving(true);
    try {
      // Create client user first (simplified - in real app would check if exists)
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
        status: 'planning',
        clientId: clientRef.id,
        pmId: profile.uid,
        budget: form.budget ? parseFloat(form.budget) : null,
        startDate: form.startDate ? Timestamp.fromDate(new Date(form.startDate)) : null,
        estimatedEndDate: form.estimatedEndDate ? Timestamp.fromDate(new Date(form.estimatedEndDate)) : null,
        createdAt: Timestamp.now(),
      });

      router.push(`/dashboard/projects/${projectRef.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
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

        {currentStep === 'address' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Project Location</h2>
              <p className="text-sm text-gray-500 mb-6">Where is this project located?</p>
            </div>
            <Input
              label="Street Address"
              placeholder="123 Main St"
              value={form.street}
              onChange={(e) => updateForm('street', e.target.value)}
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
