
"use client";
import React from 'react';

export default function HomePage() {
  // Redirect to a default page or show a welcome message.
  // If you had a router.replace('/dashboard'), you might want to remove or change it.
  // For now, just a simple welcome.
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // window.location.href = '/dashboard'; // Or your preferred starting page
    }
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <h1 className="text-2xl">Welcome to MarketWatch AI (Project Reset)</h1>
    </div>
  );
}
