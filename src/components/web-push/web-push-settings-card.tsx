"use client";

import { BellRing, BellOff, ShieldAlert } from "lucide-react";

import { useWebPushNotifications } from "@/components/web-push/web-push-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getStatusLabel(status: ReturnType<typeof useWebPushNotifications>["status"]): string {
  switch (status) {
    case "unsupported":
      return "Unsupported";
    case "not-configured":
      return "Not configured";
    case "permission-denied":
      return "Permission denied";
    case "subscribed":
      return "Subscribed";
    case "subscribing":
      return "Subscribing";
    case "permission-default":
      return "Permission needed";
    case "permission-granted":
      return "Permission granted";
    case "not-subscribed":
      return "Not subscribed";
    case "error":
      return "Needs attention";
    default:
      return "Unknown";
  }
}

export function WebPushSettingsCard() {
  const webPush = useWebPushNotifications();

  return (
    <Card className="rounded-[1.75rem] border-white/55 bg-card/84">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {webPush.status === "subscribed" ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </div>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
            {getStatusLabel(webPush.status)}
          </Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl tracking-[-0.03em]">
            Browser notifications
          </CardTitle>
          <CardDescription className="text-sm leading-6">
            Enable browser notifications to receive important Transpo24 admin updates even when the dashboard is in the background or closed.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {webPush.status === "permission-denied" ? (
          <div className="rounded-2xl border border-amber-300/50 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            The browser blocked notifications for this site. Re-enable them from the browser site settings, then refresh this page.
          </div>
        ) : null}

        {webPush.status === "not-configured" ? (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              The public Web Push VAPID key is missing. Set
              {" "}
              <code>NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY</code>
              {" "}
              before enabling notifications.
            </span>
          </div>
        ) : null}

        {webPush.errorMessage ? (
          <div className="rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {webPush.errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {webPush.permission === "default" || webPush.status === "not-subscribed" ? (
            <Button
              type="button"
              onClick={() => {
                void webPush.enableNotifications();
              }}
              disabled={
                webPush.status === "subscribing" ||
                webPush.status === "unsupported" ||
                webPush.status === "not-configured"
              }
              className="rounded-full px-6"
            >
              {webPush.status === "subscribing"
                ? "Enabling..."
                : "Enable notifications"}
            </Button>
          ) : null}

          {webPush.status === "subscribed" ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void webPush.disableNotifications();
              }}
              className="rounded-full px-6"
            >
              Disable notifications on this browser
            </Button>
          ) : null}
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          Live in-app updates and toasts continue working as before while the dashboard is open. Browser Web Push is an additional background channel, not a replacement.
        </p>
      </CardContent>
    </Card>
  );
}
