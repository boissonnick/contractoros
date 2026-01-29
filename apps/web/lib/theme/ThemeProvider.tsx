"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/auth';
import { OrgBranding } from '@/types';

const DEFAULT_BRANDING: OrgBranding = {
  primaryColor: '#2563eb',
  secondaryColor: '#64748b',
  accentColor: '#f59e0b',
};

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Generate a lighter tint of a color (for backgrounds)
 */
function getLightVariant(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#eff6ff';
  // Mix with white at 90% ratio for very light tint
  return rgbToHex(
    rgb.r + (255 - rgb.r) * 0.9,
    rgb.g + (255 - rgb.g) * 0.9,
    rgb.b + (255 - rgb.b) * 0.9
  );
}

/**
 * Generate a darker shade of a color (for hover states)
 */
function getDarkVariant(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#1d4ed8';
  // Darken by 15%
  return rgbToHex(
    rgb.r * 0.85,
    rgb.g * 0.85,
    rgb.b * 0.85
  );
}

interface ThemeContextType {
  branding: OrgBranding;
  logoURL: string | null;
}

const ThemeContext = createContext<ThemeContextType>({
  branding: DEFAULT_BRANDING,
  logoURL: null,
});

export const useTheme = () => useContext(ThemeContext);

function applyBrandCSS(branding: OrgBranding) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  // Primary color and variants
  root.style.setProperty('--color-primary', branding.primaryColor);
  root.style.setProperty('--color-primary-light', getLightVariant(branding.primaryColor));
  root.style.setProperty('--color-primary-dark', getDarkVariant(branding.primaryColor));

  // Secondary color and variants
  root.style.setProperty('--color-secondary', branding.secondaryColor);
  root.style.setProperty('--color-secondary-light', getLightVariant(branding.secondaryColor));

  // Accent color and variants
  root.style.setProperty('--color-accent', branding.accentColor);
  root.style.setProperty('--color-accent-light', getLightVariant(branding.accentColor));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [branding, setBranding] = useState<OrgBranding>(DEFAULT_BRANDING);
  const [logoURL, setLogoURL] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.orgId) {
      applyBrandCSS(DEFAULT_BRANDING);
      return;
    }

    const unsub = onSnapshot(doc(db, 'organizations', profile.orgId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const b: OrgBranding = data.branding || DEFAULT_BRANDING;
        setBranding(b);
        setLogoURL(b.logoURL || data.logoURL || null);
        applyBrandCSS(b);
      }
    });

    return () => unsub();
  }, [profile?.orgId]);

  return (
    <ThemeContext.Provider value={{ branding, logoURL }}>
      {children}
    </ThemeContext.Provider>
  );
}
