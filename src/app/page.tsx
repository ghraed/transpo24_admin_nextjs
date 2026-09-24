"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Authenticated, useLogout } from "@refinedev/core";
import {
  ArrowRight,
  BellRing,
  ClipboardCheck,
  Coins,
  LogOut,
  Route,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWebPushNotifications } from "@/components/web-push/web-push-provider";
import { cn } from "@/lib/utils";

const modules = [
  {
    title: "Route Blocks",
    href: "/route-blocks",
    description: "Manage directional route restrictions. Routes are allowed unless an active block applies.",
    icon: Route,
    eyebrow: "Operations",
    iconClass: "bg-[#FFF1C9] text-[#9A6500]",
  },
  {
    title: "Admin Users",
    href: "/admin-users",
    description: "Manage admin access, roles, active state, and account recovery flows.",
    icon: Shield,
    eyebrow: "Identity & access",
    iconClass: "bg-[#FFF1C9] text-[#9A6500]",
  },
  {
    title: "Driver Requests",
    href: "/driver-reviews",
    description: "Review onboarding submissions, inspect documents, and approve or reject requests.",
    icon: ClipboardCheck,
    eyebrow: "Operational review",
    iconClass: "bg-[#FFF1C9] text-[#9A6500]",
  },
  {
    title: "Delivery Operations",
    href: "/delivery-operations",
    description: "Trace every client request from driver offers and assignment through delivery proof and payment status.",
    icon: Route,
    eyebrow: "Live delivery tracking",
    iconClass: "bg-[#E5F6F1] text-[#087968]",
  },
  {
    title: "Driver Earnings",
    href: "/driver-earnings",
    description: "Track pending holds, payout retries, and transfer failures for driver earnings.",
    icon: Coins,
    eyebrow: "Billing & payouts",
    iconClass: "bg-[#FFF1C9] text-[#9A6500]",
  },
];

export default function IndexPage() {
  const webPush = useWebPushNotifications();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const canEnableNotifications =
    webPush.permission === "default" || webPush.status === "not-subscribed";

  return (
    <Suspense>
      <Authenticated key="home-page">
        <div className="mx-auto my-2 flex w-full max-w-[1440px] flex-col gap-6 px-2 pb-2 md:my-4 md:px-4 xl:px-6">
          <section className="overflow-hidden rounded-[1.75rem] border border-[#F1D58B] bg-[linear-gradient(135deg,#FFF9E8_0%,#FFFFFF_72%)] shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
            <div className="app-shell-grid relative px-6 py-7 md:px-8 md:py-9 lg:px-10">
              <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_center,_color-mix(in_oklab,var(--primary)_22%,transparent)_0,_transparent_62%)] lg:block" />
              <div className="relative max-w-3xl">
                <Badge className="rounded-full border-0 bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground shadow-none">
                  Transpo24 operations
                </Badge>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                  Everything moving through Transpo24, in one place.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  Trace deliveries, review drivers, manage access, monitor earnings, and resolve payment issues from one focused workspace.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6"
                    onClick={() => {
                      void webPush.enableNotifications();
                    }}
                    disabled={
                      !canEnableNotifications ||
                      webPush.status === "subscribing" ||
                      webPush.status === "unsupported" ||
                      webPush.status === "not-configured"
                    }
                  >
                    <BellRing className="h-4 w-4" />
                    {webPush.status === "subscribing"
                      ? "Enabling..."
                      : webPush.status === "subscribed"
                        ? "Notifications enabled"
                        : "Enable notifications"}
                  </Button>
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    className="rounded-full border-destructive/30 px-6 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => logout()}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {modules.map((module) => {
              const Icon = module.icon;

              return (
                <Link key={module.href} href={module.href} className="group">
                  <Card className="h-full rounded-3xl border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_16px_30px_-22px_rgba(17,24,39,0.38)]">
                    <CardHeader className="gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", module.iconClass)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                          {module.eyebrow}
                        </div>
                        <CardTitle className="text-2xl tracking-[-0.03em]">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-6">
                          {module.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </section>
        </div>
      </Authenticated>
    </Suspense>
  );
}
