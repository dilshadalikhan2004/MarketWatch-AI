
"use client";
import type { ReactNode } from 'react';
import React from 'react';

// If you were using QueryClientProvider or TooltipProvider, re-add them as needed.
// For now, it's a simple pass-through.
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
  // const [queryClient] = React.useState(() => new QueryClient());
  
  return (
    // <QueryClientProvider client={queryClient}>
    //   <TooltipProvider delayDuration={0}>
    //     {children}
    //   </TooltipProvider>
    // </QueryClientProvider>
    <>{children}</>
  );
}
