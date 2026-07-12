"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Authenticated } from "@refinedev/core";
import {
  ArrowRight,
  ClipboardCheck,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WebPushSettingsCard } from "@/components/web-push/web-push-settings-card";
import { cn } from "@/lib/utils";

const modules = [
  {
    title: "Admin Users",
    href: "/admin-users",
    description: "Manage admin access, roles, active state, and account recovery flows.",
    icon: Shield,
    eyebrow: "Identity & access",
  },
  {
    title: "Driver Requests",
    href: "/driver-reviews",
    description: "Review onboarding submissions, inspect documents, and approve or reject requests.",
    icon: ClipboardCheck,
    eyebrow: "Operational review",
  },
];

const roadmap = [
  "Add future modules without redesigning navigation",
  "Keep each feature in a focused workspace route",
  "Scale the dashboard with metrics, alerts, and queues",
];

export default function IndexPage() {
  return (
    <Suspense>
      <Authenticated key="home-page">
        <div className="flex flex-col gap-6 pb-2">
          <section className="overflow-hidden rounded-[2rem] border border-white/55 bg-card/84 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="app-shell-grid relative px-6 py-7 md:px-8 md:py-9 lg:px-10">
              <div className="absolute inset-y-0 right-0 hidden w-2/5 bg-[radial-gradient(circle_at_center,_color-mix(in_oklab,var(--primary)_22%,transparent)_0,_transparent_62%)] lg:block" />
              <div className="relative max-w-3xl">
                <Badge className="rounded-full border-0 bg-primary/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary shadow-none">
                  Modern admin shell
                </Badge>
                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
                  A cleaner control center for the modules you have now and the ones you add next.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                  The app now starts from a real dashboard, keeps each feature in a focused workspace, and leaves room for more operational tools without another layout rewrite.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link href="/driver-reviews">
                      Open driver requests
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="rounded-full px-6"
                  >
                    <Link href="/admin-users">Manage admin users</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => {
                const Icon = module.icon;

                return (
                  <Link key={module.href} href={module.href} className="group">
                    <Card className="h-full rounded-[1.75rem] border-white/55 bg-card/84 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_26px_60px_-38px_rgba(15,23,42,0.45)]">
                      <CardHeader className="gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
            </div>

            <Card className="rounded-[1.75rem] border-white/55 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--card)_86%,white),color-mix(in_oklab,var(--card)_96%,var(--muted)))]">
              <CardHeader className="gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Expansion roadmap
                </div>
                <CardTitle className="text-2xl tracking-[-0.03em]">
                  Structure that scales
                </CardTitle>
                <CardDescription className="leading-6">
                  Your current modules stay prominent, while future features can be added as first-class navigation items and dashboard cards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {roadmap.map((item, index) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background/72 px-4 py-3"
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
                      )}
                    >
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                  </div>
                ))}
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold">Next module slot</div>
                      <div className="text-sm text-muted-foreground">
                        Add the next feature here when it is ready.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <WebPushSettingsCard />
            <Card className="rounded-[1.75rem] border-white/55 bg-card/84">
              <CardHeader className="gap-2">
                <CardTitle className="text-2xl tracking-[-0.03em]">
                  Notification delivery
                </CardTitle>
                <CardDescription className="leading-6">
                  Keep using live in-app updates while the dashboard is open, and add browser notifications for important admin events when the tab is hidden or closed.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
                <p>
                  Browser permission is requested only after you click the enable button.
                </p>
                <p>
                  The browser subscription is synchronized with the NestJS backend and removed during logout to avoid cross-account leakage on shared machines.
                </p>
                <p>
                  Production Web Push requires HTTPS. Localhost works for development, but plain LAN HTTP addresses may not expose full service-worker or notification support.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </Authenticated>
    </Suspense>
  );
}
