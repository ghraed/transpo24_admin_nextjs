"use client";

import { Authenticated, usePermissions } from "@refinedev/core";
import { Layout } from "@/components/refine-ui/layout/layout";
import type { ReactNode } from "react";

function AdminOnly({ children }: { children: ReactNode }) {
  const { data, isLoading } = usePermissions<string[]>({});
  if (isLoading) return <p role="status">Checking admin access…</p>;
  if (!data?.includes("ADMIN")) return <p role="alert">Administrator access is required.</p>;
  return <Layout>{children}</Layout>;
}

export default function RouteBlocksLayout({ children }: { children: ReactNode }) {
  return <Authenticated key="route-blocks" redirectOnFail="/login">
    <AdminOnly>{children}</AdminOnly>
  </Authenticated>;
}
