"use client";

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ProjectRedirect() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/dashboard/projects/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
