"use client";

import React from 'react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

interface ComingSoonProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
        {icon || <WrenchScrewdriverIcon className="h-10 w-10 text-blue-500" />}
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500 text-center max-w-md">
        {description || 'This feature is under development and will be available soon.'}
      </p>
      <div className="mt-8 flex items-center gap-2 text-sm text-gray-400">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span>In Development</span>
      </div>
    </div>
  );
}
