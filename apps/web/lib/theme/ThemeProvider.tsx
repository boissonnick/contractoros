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
  root.style.setProperty('--color-primary', branding.primaryColor);
  root.style.setProperty('--color-secondary', branding.secondaryColor);
  root.style.setProperty('--color-accent', branding.accentColor);
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
