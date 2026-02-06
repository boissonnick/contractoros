'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  toggleDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType>({ isDemoMode: false, toggleDemoMode: () => {} });

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('contractoros-demo-mode') === 'true';
  });

  const toggleDemoMode = useCallback(() => {
    setIsDemoMode(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('contractoros-demo-mode', String(next));
      }
      return next;
    });
  }, []);

  return <DemoContext.Provider value={{ isDemoMode, toggleDemoMode }}>{children}</DemoContext.Provider>;
}

export const useDemoMode = () => useContext(DemoContext);
