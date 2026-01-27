"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { UserRole } from '@/types';

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'OWNER':
    case 'PM':
      return '/dashboard';
    case 'EMPLOYEE':
    case 'CONTRACTOR':
      return '/field';
    case 'SUB':
      return '/sub';
    case 'CLIENT':
      return '/client';
    default:
      return '/login';
  }
}

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const role = userData.role as UserRole;
          router.replace(getRedirectPath(role));
        } else {
          // User exists in Auth but not in Firestore - send to login
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        router.replace('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">ContractorOS</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
