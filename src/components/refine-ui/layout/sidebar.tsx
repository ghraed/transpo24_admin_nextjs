"use client";

import React from "react";
import { useLink, useMenu, type TreeMenuItem } from "@refinedev/core";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ClipboardCheck,
  ListIcon,
  Shield,
} from "lucide-react";

const futureModules = [
  "Billing and settlements",
  "Live fleet incidents",
  "Support escalations",
];

export function Sidebar() {
  const { menuItems, selectedKey } = useMenu();
  const { open, isMobile, setOpenMobile } = useSidebar();

  return (
    <ShadcnSidebar collapsible="icon" className="border-none bg-transparent">
      <SidebarRail />
      <div className="flex h-full flex-col px-2 py-2 md:px-0 md:py-0">
        <div className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-sidebar-border/80 bg-sidebar text-sidebar-foreground shadow-[0_25px_60px_-35px_rgba(15,23,42,0.8)]">
          <SidebarHeader className="border-b border-sidebar-border/80 px-4 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-cyan-950/25">
                <Shield className="h-5 w-5" />
              </div>
              <div
                className={cn(
                  "min-w-0 transition-all duration-200",
                  open ? "opacity-100" : "opacity-0 md:pointer-events-none"
                )}
              >
                <div className="text-sm font-semibold tracking-[-0.02em]">
                  Transpo24 Admin
                </div>
                <div className="text-xs text-sidebar-foreground/65">
                  Operations control center
                </div>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="flex flex-1 flex-col gap-6 px-3 py-4">
            <div className="space-y-3">
              <div
                className={cn(
                  "px-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/55",
                  !open && "md:opacity-0"
                )}
              >
                Active modules
              </div>
              <SidebarMenu className="gap-2">
                {menuItems.map((item: TreeMenuItem) => (
                  <SidebarNavItem
                    key={item.key || item.name}
                    item={item}
                    selectedKey={selectedKey}
                    onNavigate={() => {
                      if (isMobile) {
                        setOpenMobile(false);
                      }
                    }}
                  />
                ))}
              </SidebarMenu>
            </div>

            <div
              className={cn(
                "rounded-[1.5rem] border border-sidebar-border/80 bg-white/5 p-4",
                !open && "md:hidden"
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">Built to expand</div>
                  <div className="mt-1 text-xs leading-5 text-sidebar-foreground/65">
                    The shell is ready for additional modules without changing the navigation pattern.
                  </div>
                </div>
                <Badge className="rounded-full border-0 bg-sidebar-primary/90 px-2.5 py-1 text-[10px] text-sidebar-primary-foreground">
                  Future-ready
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                {futureModules.map((module) => (
                  <div
                    key={module}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-xs"
                  >
                    <span className="text-sidebar-foreground/78">{module}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-sidebar-foreground/45" />
                  </div>
                ))}
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/80 px-3 py-3">
            <Button
              variant="ghost"
              className={cn(
                "h-auto w-full justify-start rounded-2xl px-3 py-3 text-left text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                !open && "md:justify-center md:px-0"
              )}
            >
              <ClipboardCheck className="h-4 w-4 shrink-0" />
              <div className={cn("ml-3", !open && "md:hidden")}>
                <div className="text-sm font-medium">Review queue</div>
                <div className="text-xs text-sidebar-foreground/60">
                  Admin users and driver requests
                </div>
              </div>
            </Button>
          </SidebarFooter>
        </div>
      </div>
    </ShadcnSidebar>
  );
}

function SidebarNavItem({
  item,
  selectedKey,
  onNavigate,
}: {
  item: TreeMenuItem;
  selectedKey?: string;
  onNavigate?: () => void;
}) {
  const Link = useLink();
  const isSelected = item.key === selectedKey;
  const icon = item.meta?.icon ?? item.icon ?? <ListIcon className="h-4 w-4" />;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isSelected}
        tooltip={getDisplayName(item)}
        className={cn(
          "h-auto min-h-14 rounded-2xl px-3 py-3 transition-all duration-200",
          "data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_16px_30px_-18px_rgba(34,211,238,0.85)]",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Link
          to={item.route || ""}
          className="flex w-full items-center gap-3"
          onClick={onNavigate}
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
              isSelected
                ? "border-white/10 bg-black/10 text-sidebar-primary-foreground"
                : "border-sidebar-border/70 bg-white/5 text-sidebar-foreground/82"
            )}
          >
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">
              {getDisplayName(item)}
            </div>
            <div
              className={cn(
                "truncate text-xs",
                isSelected
                  ? "text-sidebar-primary-foreground/72"
                  : "text-sidebar-foreground/55"
              )}
            >
              {item.name === "admin_users"
                ? "Manage staff access and status"
                : "Handle onboarding review decisions"}
            </div>
          </div>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function getDisplayName(item: TreeMenuItem) {
  return item.meta?.label ?? item.label ?? item.name;
}
