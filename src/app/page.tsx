
"use client";

import React, { useEffect } from 'react';
import { useRouter } from "next/navigation";

// This page component should ideally not be visibly rendered if the redirect
// in next.config.js is working correctly for the root path.
// It serves as a client-side fallback.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect as a failsafe.
    router.replace('/dashboard');
  }, [router]);

  // Return null or a minimal loader as the primary redirect is server-side.
  return null;
}
