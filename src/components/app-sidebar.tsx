
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
  SidebarInset, 
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
  Briefcase, 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/watchlist", label: "Watchlist", icon: ListChecks },
  { href: "/portfolio", label: "My Portfolio", icon: Briefcase }, 
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/sentiment", label: "Sentiment Analysis", icon: Sparkles },
  { href: "/assistant", label: "AI Assistant", icon: Bot },
  { href: "/tracker", label: "Live Tracker", icon: LineChart },
];

const LOCALSTORAGE_KEYS_TO_CLEAR = [
  'marketwatch_ai_watchlist_v1',
  'marketwatch_ai_alerts_v1',
  'marketwatch_ai_user_portfolio_v1',
  'marketwatch_username',
  'marketwatch_email',
  'marketwatch_market_alerts_enabled',
  'marketwatch_news_digest_enabled',
  'theme'
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      LOCALSTORAGE_KEYS_TO_CLEAR.forEach(key => {
        localStorage.removeItem(key);
      });
      // Special handling for theme to immediately update UI
      document.documentElement.classList.remove('dark'); 
      document.documentElement.classList.add('light'); // Or your default theme
    }
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    router.push('/dashboard'); // Redirect to dashboard or a login page if you had one
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
              <Link href="/settings" className={cn(
                "w-full inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-4 py-2",
                "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80"
              )}>
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              aria-label="Logout"
            >
              <LogOut />
              <span>Logout</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-4 text-center text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © {new Date().getFullYear()} MarketWatch AI
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export { SidebarInset } from "@/components/ui/sidebar";
