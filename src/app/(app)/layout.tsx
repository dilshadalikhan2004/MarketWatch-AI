
"use client";

import React from 'react';
import { AppSidebar, SidebarInset } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar'; // Import SidebarProvider

// This component will be the actual layout structure, rendered inside SidebarProvider
function InnerAppLayout({ children }: { children: React.ReactNode; }) {
  // If you needed to access sidebar state directly in this layout file,
  // you could call useSidebar() here, as it's now within SidebarProvider.
  // const { state } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar /> {/* Your AppSidebar component IS the sidebar */}
      <SidebarInset className="flex-1 p-4 pt-6 md:p-6 lg:p-8"> {/* SidebarInset adjusts content based on sidebar state */}
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
      <InnerAppLayout>{children}</InnerAppLayout>
    </SidebarProvider>
  );
}
