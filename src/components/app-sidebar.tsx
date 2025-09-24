"use client";

import {
  Map,
  Home,
  Plus,
  Settings,
  HelpCircle,
  Plane,
  Bell,
  LogOut,
  Users,
  Shield,
  Radio,
  IdCard,
  Mountain,
  AlertTriangle,
  Satellite,
  Route,
} from "lucide-react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Main navigation items
const mainItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
  },
  {
    title: "Blockchain ID Issuance",
    url: "/blockchain-id",
    icon: IdCard,
  },
  {
    title: "Alerts Management",
    url: "/alerts",
    icon: AlertTriangle,
  },
  {
    title: "Tracking Devices",
    url: "/transport",
    icon: Radio,
  },
  {
    title: "Geofencing",
    url: "/geofencing",
    icon: Shield,
  },
  {
    title: "Add Geofencing",
    url: "/geofencing/add",
    icon: Plus,
  },
  {
    title: "Test Route",
    url: "/test-route",
    icon: Route,
  },
  {
    title: "Offline Activities",
    url: "/activities/offline",
    icon: Mountain,
  },
  {
    title: "Online Activities",
    url: "/activities/online",
    icon: Map,
  },
  {
    title: "Accommodations",
    url: "/accommodations",
    icon: Home,
  },
  {
    title: "Active Trips",
    url: "/trips/active",
    icon: Plane,
  },
  {
    title: "Map Tool",
    url: "/maptool",
    icon: Map,
  },
];

// Additional tools
const toolItems = [
  {
    title: "Provide Help",
    url: "/help",
    icon: HelpCircle,
  },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      // Call backend logout endpoint to revoke refresh token
      if (session?.refreshToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refresh_token: session.refreshToken,
          }),
        });
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Always sign out from NextAuth regardless of backend call success
      signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <Map className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Surakshit
            </h2>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="w-full"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center space-x-3"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools & Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="w-full"
                  >
                    <Link
                      href={item.url}
                      className="flex items-center space-x-3"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        {session && (
          <div className="space-y-3">
            <div className="flex items-center space-x-3 px-2 py-2 bg-muted rounded-lg">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {session.user?.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {session.user?.name || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>

            <SidebarMenuButton
              onClick={handleLogout}
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
