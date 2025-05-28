
"use client";

import React, { useEffect } from 'react';
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-6">
      <p className="text-lg text-muted-foreground">Redirecting to your dashboard...</p>
      {/* You can add a loader here if desired */}
    </div>
  );
}
