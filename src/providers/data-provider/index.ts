"use client";

import type { DataProviders, HttpError } from "@refinedev/core";
import dataProviderSimpleRest from "@refinedev/simple-rest";
import axios from "axios";
import Cookies from "js-cookie";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const axiosInstance = axios.create();

function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as { message?: unknown; error?: unknown };

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  if (Array.isArray(candidate.message)) {
    const joined = candidate.message
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(", ");
    if (joined) {
      return joined;
    }
  }

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  return null;
}

function normalizeHttpError(error: unknown): HttpError {
  if (axios.isAxiosError(error)) {
    return {
      message:
        extractErrorMessage(error.response?.data) ||
        error.response?.statusText ||
        error.message ||
        "Request failed.",
      statusCode: error.response?.status ?? error.status ?? 500,
      errors: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    message: "Request failed.",
    statusCode: 500,
  };
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove("token", { path: "/" });
      Cookies.remove("auth", { path: "/" });
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

const simpleRestProvider = dataProviderSimpleRest(API_URL, axiosInstance);

export const dataProvider: DataProviders = {
  default: simpleRestProvider,
  adminUsers: {
    ...simpleRestProvider,
    getList: async (params) => {
      const current = (params.pagination as { current?: number; pageSize?: number } | undefined)?.current ?? 1;
      const pageSize = (params.pagination as { current?: number; pageSize?: number } | undefined)?.pageSize ?? 10;

      const { data } = await axiosInstance.get(
        `${API_URL}/admin/users`,
        {}
      );

      const start = Math.max(current - 1, 0) * pageSize;
      const paginatedData = data.slice(start, start + pageSize);
      const total = data.length;

      return {
        data: paginatedData,
        total,
      };
    },
    getOne: async (params) => {
      const { data } = await axiosInstance.get(
        `${API_URL}/admin/users/${params.id}`
      );
      return { data };
    },
    create: async (params) => {
      const { data } = await axiosInstance.post(
        `${API_URL}/admin/users`,
        params.variables
      );
      return { data };
    },
    update: async (params) => {
      const { data } = await axiosInstance.put(
        `${API_URL}/admin/users/${params.id}`,
        params.variables
      );
      return { data };
    },
    deleteOne: async (params) => {
      const { data } = await axiosInstance.delete(
        `${API_URL}/admin/users/${params.id}`
      );
      return { data };
    },
    custom: async (params) => {
      try {
        if (
          params.method === "post" &&
          params.url?.match(/^\/admin\/users\/[^/]+\/reactivate$/)
        ) {
          const { data } = await axiosInstance.post(`${API_URL}${params.url}`);
          return { data };
        }

        return simpleRestProvider.custom?.(params);
      } catch (error) {
        throw normalizeHttpError(error);
      }
    },
    getApiUrl: () => API_URL,
  },
  adminDriverReviews: {
    ...simpleRestProvider,
    custom: async (params) => {
      try {
        if (params.url?.startsWith("/admin/driver-reviews")) {
          const method = params.method?.toLowerCase() ?? "get";

          if (method === "get") {
            const { data } = await axiosInstance.get(`${API_URL}${params.url}`);
            return { data: { items: data } };
          }

          if (method === "post") {
            const body =
              (params as { payload?: unknown; values?: unknown }).payload ??
              (params as { payload?: unknown; values?: unknown }).values ??
              {};
            const { data } = await axiosInstance.post(
              `${API_URL}${params.url}`,
              body
            );
            return { data };
          }
        }

        return simpleRestProvider.custom?.(params);
      } catch (error) {
        throw normalizeHttpError(error);
      }
    },
    getApiUrl: () => API_URL,
  },
  adminDriverEarnings: {
    ...simpleRestProvider,
    custom: async (params) => {
      try {
        if (params.url?.startsWith("/admin/driver-earnings")) {
          const method = params.method?.toLowerCase() ?? "get";

          if (method === "get") {
            const { data } = await axiosInstance.get(`${API_URL}${params.url}`);
            return { data };
          }

          if (method === "post") {
            const body =
              (params as { payload?: unknown; values?: unknown }).payload ??
              (params as { payload?: unknown; values?: unknown }).values ??
              {};
            const { data } = await axiosInstance.post(
              `${API_URL}${params.url}`,
              body
            );
            return { data };
          }
        }

        return simpleRestProvider.custom?.(params);
      } catch (error) {
        throw normalizeHttpError(error);
      }
    },
    getApiUrl: () => API_URL,
  },
  adminPaymentDisputes: {
    ...simpleRestProvider,
    custom: async (params) => {
      try {
        if (params.url?.startsWith("/admin/payments/disputes")) {
          const method = params.method?.toLowerCase() ?? "get";

          if (method === "get") {
            const { data } = await axiosInstance.get(`${API_URL}${params.url}`);
            return { data };
          }
        }

        return simpleRestProvider.custom?.(params);
      } catch (error) {
        throw normalizeHttpError(error);
      }
    },
    getApiUrl: () => API_URL,
  },
};
