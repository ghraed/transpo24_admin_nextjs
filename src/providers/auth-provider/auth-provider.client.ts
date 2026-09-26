"use client";

import type { AuthProvider } from "@refinedev/core";
import Cookies from "js-cookie";
import { cleanupWebPushOnLogout } from "@/lib/web-push";

import { API_URL } from "@/lib/api/config";
import { extractErrorMessage } from "@/lib/api/errors";
import { validateAdminSession, type AdminUser } from "@/lib/auth/session";

const AUTH_COOKIE = "auth";
const TOKEN_COOKIE = "token";

function clearSession() {
  Cookies.remove(TOKEN_COOKIE, { path: "/" });
  Cookies.remove(AUTH_COOKIE, { path: "/" });
}

// Coalesce simultaneous Refine checks without caching revoked sessions.
let pending: { token: string; result: Promise<AdminUser | null> } | undefined;
function getSession(): Promise<AdminUser | null> {
  const token = Cookies.get(TOKEN_COOKIE);
  if (!token) return Promise.resolve(null);
  if (pending?.token === token) return pending.result;
  const result = validateAdminSession(token).then(user => {
    if (!user && Cookies.get(TOKEN_COOKIE) === token) clearSession();
    return user;
  }).finally(() => {
    if (pending?.result === result) pending = undefined;
  });
  pending = { token, result };
  return result;
}

export const authProviderClient: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        return {
          success: false,
          error: {
            name: "LoginError",
            message:
              extractErrorMessage(errorData) ??
              response.statusText ??
              "Request failed.",
          },
        };
      }

      const data = (await response.json()) as {
        accessToken: string;
        user: AdminUser;
      };

      if (!data.accessToken || data.user?.role !== "ADMIN") {
        return { success: false, error: { name: "LoginError", message: "Administrator access is required." } };
      }
      Cookies.set(TOKEN_COOKIE, data.accessToken, {
        expires: 30,
        sameSite: "lax",
        secure: window.location.protocol === "https:",
        path: "/",
      });
      Cookies.set(AUTH_COOKIE, JSON.stringify(data.user), {
        expires: 30,
        sameSite: "lax",
        secure: window.location.protocol === "https:",
        path: "/",
      });

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error) {
      return {
        success: false,
        error: {
          name: "LoginError",
          message:
            error instanceof Error
              ? error.message
              : "Request failed.",
        },
      };
    }
  },
  logout: async () => {
    const token = Cookies.get(TOKEN_COOKIE);

    try {
      await cleanupWebPushOnLogout().catch(() => undefined);

      if (token) {
        await fetch(`${API_URL}/auth/admin/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => undefined);
      }
    } finally {
      clearSession();
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    try {
      const user = await getSession();
      if (user) return { authenticated: true };
      return { authenticated: false, logout: true, redirectTo: "/login" };
    } catch (error) {
      return { authenticated: false, logout: false, redirectTo: "/login", error: error as Error };
    }
  },
  getPermissions: async () => {
    const user = await getSession();
    return user ? [user.role] : null;
  },
  getIdentity: getSession,
  onError: async (error) => {
    if ((error.statusCode ?? error.response?.status) === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
