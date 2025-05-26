
"use client";
import React from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import Link from "next/link";
import { AreaChart } from "lucide-react";

export function AppSidebar() {
  // AppSidebar content cleared. You can rebuild the navigation here.
  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2">
            <AreaChart className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">
              MarketWatch AI
            </h1>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <p className="p-4 text-sm text-muted-foreground group-data-[collapsible=icon]:hidden">Navigation cleared.</p>
           <div className="flex justify-center group-data-[collapsible=icon]:flex">
             <AreaChart className="h-6 w-6 text-muted-foreground hidden group-data-[collapsible=icon]:block" />
           </div>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <p className="p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Footer cleared.</p>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
}
