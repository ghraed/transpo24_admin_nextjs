"use client";

import type { ReactNode } from "react";
import { Authenticated } from "@refinedev/core";
import { WebPushProvider } from "@/components/web-push/web-push-provider";

export function ProtectedSession({ children }: { children: ReactNode }) {
  return (
    <Authenticated key="admin-session" redirectOnFail="/login" loading={<p role="status">Checking admin access…</p>}>
      <WebPushProvider>{children}</WebPushProvider>
    </Authenticated>
  );
}
