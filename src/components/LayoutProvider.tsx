"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface LayoutProviderProps {
  children: React.ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

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
                <SidebarTrigger className="mb-4 lg:hidden" />
                {children}
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
    );
  }

  // For login page and unauthenticated users
  return <>{children}</>;
}
