
import React from 'react';
import { AppSidebar, SidebarInset } from '@/components/app-sidebar'; // Assuming SidebarInset is exported from app-sidebar or a similar ui/sidebar file

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset> {/* This component should handle the main content area's padding and responsive behavior to the sidebar */}
        <main className="flex-1 p-4 pt-6 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
