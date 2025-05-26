
import React from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // App layout cleared. You might want to re-add sidebar or other common UI elements.
  return <main className="p-4 md:p-6 lg:p-8">{children}</main>;
}
