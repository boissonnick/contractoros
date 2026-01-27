import React from 'react';
import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: 'ContractorOS',
    template: '%s | ContractorOS',
  },
  description: 'Field-first contractor management platform',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}