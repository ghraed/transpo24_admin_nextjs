import { Layout } from "@/components/refine-ui/layout/layout";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <Layout>{children}</Layout>;
}
