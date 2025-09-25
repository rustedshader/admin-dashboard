"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useSessionValidation } from "@/hooks/useAuth";
import { ModeToggle } from "./Modetoggle";

interface LayoutProviderProps {
  children: React.ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Add session validation
  useSessionValidation();

  // Pages that shouldn't have the sidebar
  const noSidebarPages = ["/login"];
  const shouldShowSidebar =
    !noSidebarPages.includes(pathname) && status === "authenticated";

  if (shouldShowSidebar) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full">
          <div className="flex h-full">
            <div className="flex-1">
              <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-4">
                  <SidebarTrigger />
                  <ModeToggle />
                </div>
                {children}
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <ModeToggle />
      </div>
      {children}
    </div>
  );
}
