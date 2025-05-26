
"use client";

import React from 'react';
import { AppSidebar, SidebarInset } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { RealtimeStockProvider } from '@/contexts/RealtimeStockContext'; // Import the new provider

// This component will be the actual layout structure, rendered inside SidebarProvider
function InnerAppLayout({ children }: { children: React.ReactNode; }) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset className="flex-1 p-4 pt-6 md:p-6 lg:p-8">
        {children}
      </SidebarInset>
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <RealtimeStockProvider>
        <InnerAppLayout>{children}</InnerAppLayout>
      </RealtimeStockProvider>
    </SidebarProvider>
  );
}
