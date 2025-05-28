
"use client";
import React from 'react';
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
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
  PanelLeft,
  Briefcase,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/portfolio", label: "My Portfolio", icon: Briefcase },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/sentiment", label: "Sentiment Analysis", icon: Sparkles },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/tracker", label: "Live Tracker", icon: LineChart },
];

const settingsNavItem = { href: "/settings", label: "Settings", icon: Settings };


export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    // Clear localStorage items
    localStorage.removeItem('marketwatch_watchlist_v1');
    localStorage.removeItem('marketwatch_ai_alerts_v1');
    localStorage.removeItem('marketwatch_ai_user_portfolio_v1');
    localStorage.removeItem('marketwatch_username');
    localStorage.removeItem('marketwatch_email');
    localStorage.removeItem('marketwatch_market_alerts_enabled');
    localStorage.removeItem('marketwatch_news_digest_enabled');
    localStorage.removeItem('marketwatch_theme');

    // Optionally, reset theme to light mode or a default
    document.documentElement.classList.remove('dark');

    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/'); // Redirect to landing page
  };

  const isNavItemActive = (itemHref: string) => {
    // For dashboard, only active if it's exactly /dashboard
    if (itemHref === "/dashboard") {
      return pathname === itemHref;
    }
    // For other items, active if pathname starts with itemHref
    // (e.g., /portfolio/add would still highlight /portfolio)
    return pathname.startsWith(itemHref);
  };


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
          {mainNavItems.map((item) => (
            <SidebarMenuItem key={item.href}> {}
              <SidebarMenuButton
                asChild
                isActive={isNavItemActive(item.href)}
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
            <SidebarMenuButton
              asChild
              isActive={isNavItemActive(settingsNavItem.href)}
              tooltip={settingsNavItem.label}
            >
              <Link href={settingsNavItem.href}>
                <settingsNavItem.icon />
                <span>{settingsNavItem.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* Logout button is currently removed as per earlier request
          <SidebarMenuItem>
            <Button
              variant="destructive"
              className="w-full justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout" // Tooltip for collapsed state
            >
              <LogOut className="group-data-[collapsible=icon]:mr-0 mr-2 h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarMenuItem>
          */}
        </SidebarMenu>
        <div className="mt-4 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} MarketWatch AI
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { SidebarInset } from "@/components/ui/sidebar";
