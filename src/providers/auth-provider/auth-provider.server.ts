import type { AuthProvider } from "@refinedev/core";
import { cookies } from "next/headers";
import { validateAdminSession } from "@/lib/auth/session";

export const authProviderServer: Pick<AuthProvider, "check"> = {
  check: async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (await validateAdminSession(token?.value)) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: "/login",
    };
  },
};
