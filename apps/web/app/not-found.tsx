'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-9xl font-bold text-gray-200 select-none">404</div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Page Not Found
        </h1>

        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary-dark transition-colors"
          >
            <HomeIcon className="h-4 w-4" />
            Go Home
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Go Back
          </button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Popular destinations:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard"
              className="text-sm text-brand-primary hover:underline"
            >
              Dashboard
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/dashboard/projects"
              className="text-sm text-brand-primary hover:underline"
            >
              Projects
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/dashboard/schedule"
              className="text-sm text-brand-primary hover:underline"
            >
              Schedule
            </Link>
            <span className="text-gray-300">•</span>
            <Link
              href="/dashboard/clients"
              className="text-sm text-brand-primary hover:underline"
            >
              Clients
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
