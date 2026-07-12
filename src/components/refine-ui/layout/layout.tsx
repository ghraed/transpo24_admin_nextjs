"use client";

import { Header } from "@/components/refine-ui/layout/header";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { PropsWithChildren } from "react";
import { Sidebar } from "./sidebar";

export function Layout({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className="bg-transparent">
          <Header />
          <main
            className={cn(
              "@container/main relative flex flex-1 flex-col px-3 pb-6 md:px-5 md:pb-8 lg:px-8 lg:pb-10"
            )}
          >
            <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

Layout.displayName = "Layout";
