
import React from 'react';
import { AppSidebar, SidebarInset } from '@/components/app-sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset className="p-4 pt-6 md:p-6 lg:p-8"> {/* Apply padding directly here */}
        {children}
      </SidebarInset>
    </div>
  );
}
