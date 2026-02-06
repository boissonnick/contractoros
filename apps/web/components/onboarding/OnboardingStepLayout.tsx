"use client";

import React from 'react';
import { Card } from '@/components/ui';

interface OnboardingStepLayoutProps {
  title: string;
  subtitle: string;
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
}

export default function OnboardingStepLayout({ title, subtitle, currentStep, totalSteps, children }: OnboardingStepLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">ContractorOS</h1>
          <p className="text-brand-200 mt-2">{subtitle}</p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i < currentStep ? 'w-8 bg-white' : i === currentStep ? 'w-8 bg-brand-300' : 'w-2 bg-brand-400/50'
              }`}
            />
          ))}
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-2 tracking-tight">{title}</h2>
          {children}
        </Card>
      </div>
    </div>
  );
}
