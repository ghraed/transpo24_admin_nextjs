"use client";
import type { DataProvider } from "@refinedev/core";
import dataProviderSimpleRest from "@refinedev/simple-rest";
import { API_URL } from "./config";
import { axiosInstance } from "./client";
import { normalizeHttpError } from "./errors";

export const simpleRestProvider = dataProviderSimpleRest(API_URL, axiosInstance);

/** Adapt admin endpoints to Refine while keeping auth and errors consistent. */
export function createAdminProvider(prefix: string, methods: string[], wrapList = false): DataProvider {
  return {
    ...simpleRestProvider,
    custom: async (params) => {
      try {
        const pathname = params.url.split("?")[0];
        const method = params.method.toLowerCase();
        if (!(pathname === prefix || pathname.startsWith(prefix + "/")) || !methods.includes(method)) {
          throw new Error("Unsupported admin endpoint or method.");
        }
        const { data } = await axiosInstance.request({
          url: API_URL + params.url,
          method,
          data: params.payload,
        });
        return { data: wrapList && method === "get" ? { items: data } : data };
      } catch (error) {
        throw normalizeHttpError(error);
      }
    },
  };
}
