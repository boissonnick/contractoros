import React from 'react';
import type { Metadata, Viewport } from 'next';
import Providers from '@/components/Providers';
import BuildIndicator from '@/components/ui/BuildIndicator';
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: 'ContractorOS',
    template: '%s | ContractorOS',
  },
  description: 'Field-first contractor management platform',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ContractorOS',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
          <BuildIndicator />
        </Providers>
      </body>
    </html>
  );
}