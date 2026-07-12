"use client";

import type { AuthProvider } from "@refinedev/core";
import Cookies from "js-cookie";
import { cleanupWebPushOnLogout } from "@/lib/web-push";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const AUTH_COOKIE = "auth";
const TOKEN_COOKIE = "token";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
};

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
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: {
            name: "LoginError",
            message:
              errorData.message ??
              "Invalid email or password, or you do not have admin access.",
          },
        };
      }

      const data = (await response.json()) as {
        accessToken: string;
        user: AdminUser;
      };

      Cookies.set(TOKEN_COOKIE, data.accessToken, {
        expires: 30,
        path: "/",
      });
      Cookies.set(AUTH_COOKIE, JSON.stringify(data.user), {
        expires: 30,
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
              : "An unexpected error occurred. Please try again.",
        },
      };
    }
  },
  logout: async () => {
    await cleanupWebPushOnLogout().catch(() => undefined);
    Cookies.remove(TOKEN_COOKIE, { path: "/" });
    Cookies.remove(AUTH_COOKIE, { path: "/" });
    return {
      success: true,
      redirectTo: "/login",
    };
  },
  check: async () => {
    const token = Cookies.get(TOKEN_COOKIE);
    if (token) {
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
  getPermissions: async () => {
    const auth = Cookies.get(AUTH_COOKIE);
    if (auth) {
      const parsedUser = JSON.parse(auth) as AdminUser;
      return [parsedUser.role];
    }
    return null;
  },
  getIdentity: async () => {
    const auth = Cookies.get(AUTH_COOKIE);
    if (auth) {
      return JSON.parse(auth) as AdminUser;
    }
    return null;
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
