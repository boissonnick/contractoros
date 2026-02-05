/**
 * Integration Partner Logos
 *
 * SVG logos for third-party integrations.
 * All logos are simplified versions based on official brand assets.
 */

import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

/**
 * QuickBooks Logo
 * Brand colors: Green #2CA01C
 */
export function QuickBooksLogo({ className, width = 120, height = 32 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 32"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="QuickBooks"
    >
      {/* Green circle with white shape */}
      <circle cx="16" cy="16" r="14" fill="#2CA01C" />
      <path
        d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10c1.5 0 2.5-.5 2.5-.5v-3s-.5.5-2 .5c-3.866 0-7-3.134-7-7s3.134-7 7-7c1.5 0 2 .5 2 .5v-3s-1-.5-2.5-.5z"
        fill="white"
      />
      <path
        d="M20 9v14c0 0 1.5-1 1.5-3V12c0-2-1.5-3-1.5-3z"
        fill="white"
      />
      {/* QuickBooks text */}
      <text x="36" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="14" fontWeight="600" fill="#393A3D">
        QuickBooks
      </text>
    </svg>
  );
}

/**
 * Xero Logo
 * Brand colors: Blue #13B5EA
 */
export function XeroLogo({ className, width = 80, height = 32 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 80 32"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Xero"
    >
      {/* Xero wordmark */}
      <text x="0" y="23" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#13B5EA">
        xero
      </text>
    </svg>
  );
}

/**
 * Stripe Logo
 * Brand colors: Purple/Blurple #635BFF, Slate #0A2540
 */
export function StripeLogo({ className, width = 60, height = 26 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 60 25"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Stripe"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M60 12.8c0-4.24-2.06-7.58-5.98-7.58-3.94 0-6.32 3.34-6.32 7.54 0 4.98 2.82 7.5 6.86 7.5 1.98 0 3.46-.44 4.58-1.08v-3.32c-1.12.56-2.4.9-4.02.9-1.58 0-3-.56-3.18-2.48h8.02c0-.22.04-1.08.04-1.48zm-8.1-1.58c0-1.84 1.12-2.62 2.16-2.62 1 0 2.06.78 2.06 2.62h-4.22zM41.48 5.22c-1.6 0-2.62.74-3.2 1.26l-.2-1h-3.6v19.26l4.1-.86v-4.68c.58.42 1.44 1.02 2.86 1.02 2.9 0 5.54-2.32 5.54-7.44-.02-4.7-2.7-7.56-5.5-7.56zm-.96 11.64c-.96 0-1.52-.34-1.9-.76v-6c.4-.46.98-.8 1.9-.8 1.46 0 2.46 1.62 2.46 3.78 0 2.18-1 3.78-2.46 3.78zM29.24 4.22l4.12-.88V0l-4.12.86v3.36zM29.24 5.54h4.12v14.32h-4.12V5.54zM24.56 6.72l-.26-1.18h-3.54v14.32h4.1v-9.72c.96-1.26 2.6-1.02 3.1-.84V5.54c-.52-.2-2.42-.56-3.4 1.18zM16.64 1.72l-4 .84-.02 13.12c0 2.42 1.82 4.2 4.24 4.2 1.34 0 2.32-.24 2.86-.54v-3.32c-.52.2-3.08.94-3.08-1.42V8.94h3.08V5.54h-3.08V1.72zM4.32 9.76c0-.64.52-1 1.38-1 1.24 0 2.8.38 4.04 1.04V6.14c-1.36-.54-2.7-.74-4.04-.74C2.32 5.4 0 7.3 0 10.14c0 4.42 6.08 3.72 6.08 5.62 0 .76-.66 1-1.58 1-1.36 0-3.12-.56-4.5-1.32v3.72c1.54.66 3.08.94 4.5.94 3.44 0 5.8-1.7 5.8-4.58-.02-4.76-6.14-3.92-6.14-5.76h.16z"
        fill="#635BFF"
      />
    </svg>
  );
}

/**
 * Gusto Logo
 * Brand colors: Coral/Guava #F45D48, Teal #0A8080
 */
export function GustoLogo({ className, width = 80, height = 28 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 80 28"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Gusto"
    >
      {/* Gusto wordmark */}
      <text x="0" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="700" fill="#F45D48">
        gusto
      </text>
    </svg>
  );
}

/**
 * ADP Logo
 * Brand colors: Red #D0271D
 */
export function ADPLogo({ className, width = 60, height = 28 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 60 28"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ADP"
    >
      {/* ADP wordmark */}
      <text x="0" y="21" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#D0271D">
        ADP
      </text>
    </svg>
  );
}

/**
 * Generic Integration Icon (placeholder)
 */
export function GenericIntegrationIcon({ className, width = 40, height = 40 }: LogoProps) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={width}
      height={height}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Integration"
    >
      <rect width="40" height="40" rx="8" fill="#E5E7EB" />
      <path
        d="M20 12v16M12 20h16"
        stroke="#9CA3AF"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const IntegrationLogos = {
  QuickBooksLogo,
  XeroLogo,
  StripeLogo,
  GustoLogo,
  ADPLogo,
  GenericIntegrationIcon,
};

export default IntegrationLogos;
