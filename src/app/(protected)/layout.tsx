import { ProtectedSession } from "@/components/auth/protected-session";
import { authProviderServer } from "@/providers/auth-provider/auth-provider.server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await authProviderServer.check();
  if (!session.authenticated) redirect("/login");
  return <ProtectedSession>{children}</ProtectedSession>;
}
