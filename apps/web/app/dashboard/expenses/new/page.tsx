'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect to the main expenses page.
 * Expense creation is now handled via modal on the main expenses page.
 */
export default function NewExpensePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the expenses page with a query param to open the modal
    router.replace('/dashboard/expenses?add=true');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center">
      <p className="text-gray-500">Redirecting...</p>
    </div>
  );
}
