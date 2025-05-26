
"use client";
import React from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  // SidebarInset is typically used in the layout file, not directly here
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  ListChecks,
  BellRing,
  Sparkles,
  Bot,
  LineChart,
  AreaChart,
  Settings,
  LogOut,
  PanelLeft,
  Briefcase, // New icon for Portfolio
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/portfolio", label: "My Portfolio", icon: Briefcase }, // New Portfolio Link
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/sentiment", label: "Sentiment Analysis", icon: Sparkles },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/tracker", label: "Live Tracker", icon: LineChart },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-grow min-w-0" aria-label="MarketWatch AI Home">
          <AreaChart className="h-7 w-7 text-primary shrink-0" />
          <h1 className="text-xl font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden truncate">
            MarketWatch AI
          </h1>
        </Link>
        <SidebarTrigger className="md:hidden group-data-[collapsible=icon]:hidden" asChild>
          <Button variant="ghost" size="icon">
            <PanelLeft />
          </Button>
        </SidebarTrigger>
      </SidebarHeader>
      <Separator className="mb-2" />
      <SidebarContent className="flex-grow">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                tooltip={item.label}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <Separator className="mt-auto mb-2" />
      <SidebarFooter className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Logout">
              <Link href="#">
                <LogOut />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-4 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} MarketWatch AI
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

// Ensure SidebarInset is correctly exported or handled in the layout.
// It's usually part of the ui/sidebar.tsx and then re-exported or used directly in layout.
// For this component, we don't directly export SidebarInset.
// It's typically used like this:
// import { SidebarInset } from '@/components/ui/sidebar';
// Or if app-sidebar.tsx exports it (less common pattern for ui/sidebar.tsx):
// export { SidebarInset } from '@/components/ui/sidebar';
// This file is already structured to be the sidebar itself.
// Re-exporting SidebarInset from here is only needed if src/app/(app)/layout.tsx specifically imports it from app-sidebar.tsx.
// Let's assume it's imported from "@/components/ui/sidebar" in the layout.

// If SidebarInset is indeed part of your custom ui/sidebar.tsx and exported from there,
// then it's fine. If it's supposed to be a specific component defined elsewhere,
// make sure the imports align.

// Based on the error log and files provided, SidebarInset is part of ui/sidebar.tsx.
// The AppLayout in `src/app/(app)/layout.tsx` does:
// import { AppSidebar, SidebarInset } from '@/components/app-sidebar';
// This means app-sidebar.tsx *must* export SidebarInset.
export { SidebarInset } from "@/components/ui/sidebar"; // Add this re-export
