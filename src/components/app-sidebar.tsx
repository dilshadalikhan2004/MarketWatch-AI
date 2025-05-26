"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  LineChart,
  Star,
  Bell,
  BrainCircuit,
  MessageCircleQuestion,
  Settings,
  LogOut,
  AreaChart,
} from "lucide-react";
import { Separator } from "./ui/separator";
import Image from "next/image";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tracker", icon: LineChart, label: "Live Tracker" },
  { href: "/watchlist", icon: Star, label: "Watchlist" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/sentiment", icon: BrainCircuit, label: "Sentiment Analysis" },
  { href: "/assistant", icon: MessageCircleQuestion, label: "AI Assistant" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
               <AreaChart className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-foreground group-data-[collapsible=icon]:hidden">
                MarketWatch AI
              </h1>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    tooltip={{ children: item.label, side: "right", className: "bg-card text-card-foreground border-border" }}
                  >
                    <a>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <Separator className="my-2" />
           <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip={{ children: "Settings", side: "right", className: "bg-card text-card-foreground border-border" }}
                >
                  <Link href="#">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  variant="outline"
                  className="text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground bg-destructive"
                  tooltip={{ children: "Logout", side: "right", className: "bg-card text-card-foreground border-border" }}
                >
                  <Link href="#">
                    <LogOut />
                    <span>Logout</span>
                  </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
          <div className="flex items-center gap-3 p-2 mt-4 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-9 w-9">
              <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>MW</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-medium text-sidebar-foreground">User Name</span>
              <span className="text-xs text-muted-foreground">user@example.com</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold">
            <AreaChart className="h-6 w-6 text-primary" />
            <span>MarketWatch AI</span>
          </Link>
          <SidebarTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Settings /> {/* Using PanelLeft from ui/sidebar.tsx as SidebarTrigger does */}
            </Button>
          </SidebarTrigger>
        </header>
        {/* Main content will be rendered here as children */}
      </div>
    </SidebarProvider>
  );
}
