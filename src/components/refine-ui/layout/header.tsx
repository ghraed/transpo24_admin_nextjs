"use client";

import {
  useActiveAuthProvider,
  useBreadcrumb,
  useGetIdentity,
  useLogout,
} from "@refinedev/core";
import {
  Bell,
  LogOutIcon,
  Search,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import { UserAvatar } from "@/components/refine-ui/layout/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type User = {
  fullName?: string;
  email?: string;
};

export const Header = () => {
  const { breadcrumbs } = useBreadcrumb();
  const { isMobile } = useSidebar();
  const { data: user } = useGetIdentity<User>();

  const currentLabel = breadcrumbs.at(-1)?.label ?? "Overview";
  const sectionLabel = breadcrumbs.length > 1 ? breadcrumbs[0]?.label : "Operations";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 px-3 pt-3 md:px-5 md:pt-5 lg:px-8 lg:pt-6"
      )}
    >
      <div
        className={cn(
          "overflow-hidden rounded-[1.5rem] border border-white/55 bg-background/82 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl"
        )}
      >
        <div className="app-shell-grid flex items-center justify-between gap-4 px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <SidebarTrigger className="h-10 w-10 rounded-full border border-border/80 bg-background/80 text-foreground hover:bg-accent" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                <span>{sectionLabel}</span>
                {!isMobile ? (
                  <Badge variant="secondary" className="rounded-full px-2.5 py-1 text-[10px]">
                    Live workspace
                  </Badge>
                ) : null}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <h1 className="truncate text-xl font-semibold tracking-[-0.03em] md:text-2xl">
                  {currentLabel}
                </h1>
                {!isMobile && currentLabel === "Overview" ? (
                  <Sparkles className="h-4 w-4 text-primary" />
                ) : null}
              </div>
              <p className="mt-1 hidden text-sm text-muted-foreground md:block">
                {currentLabel === "Overview"
                  ? "Monitor the active modules and expand the console as new operations arrive."
                  : "Focused workspace for operational review, account control, and future workflows."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {!isMobile ? (
              <div className="relative hidden w-72 lg:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  aria-label="Search modules"
                  placeholder="Search modules"
                  className="h-11 rounded-full border-border/70 bg-background/80 pl-10"
                />
              </div>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-border/70 bg-background/80"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <ThemeToggle className="h-10 w-10 rounded-full border border-border/70 bg-background/80" />
            <UserDropdown
              fullName={user?.fullName}
              email={user?.email}
            />
          </div>
        </div>
      </div>
    </header>
  );
};

function UserDropdown({
  fullName,
  email,
}: {
  fullName?: string;
  email?: string;
}) {
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const authProvider = useActiveAuthProvider();

  if (!authProvider?.getIdentity) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-1 py-1 pr-3 text-left transition-colors hover:bg-accent"
        >
          <UserAvatar />
          <div className="hidden min-w-0 md:block">
            <div className="truncate text-sm font-semibold">
              {fullName ?? "Admin"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {email ?? "Operations access"}
            </div>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2">
        <div className="border-b border-border/70 px-2 py-2">
          <div className="text-sm font-semibold">{fullName ?? "Admin"}</div>
          <div className="text-xs text-muted-foreground">
            {email ?? "Operations access"}
          </div>
        </div>
        <DropdownMenuItem
          className="mt-2 rounded-xl text-destructive focus:text-destructive"
          onClick={() => {
            logout();
          }}
        >
          <LogOutIcon className="text-destructive" />
          <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

Header.displayName = "Header";
