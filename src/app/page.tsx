
"use client";

import React, { useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Loader2 } from 'lucide-react'; // Import a loading icon

// This page component should ideally not be visibly rendered for long
// if the redirect in next.config.js is working correctly for the root path.
// It serves as a client-side fallback with a better loading UI.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect as a failsafe or for environments where
    // next.config.js redirects might not apply immediately (e.g., some static exports).
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium">Loading Dashboard...</p>
      <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
    </div>
  );
}
