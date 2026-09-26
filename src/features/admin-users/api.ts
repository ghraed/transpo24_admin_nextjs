"use client";
import { API_URL, axiosInstance } from "@/lib/api/client";
import { normalizeHttpError } from "@/lib/api/errors";
import { simpleRestProvider } from "@/lib/api/provider";
import type { DataProvider } from "@refinedev/core";

export const adminUsersProvider: DataProvider = {
  ...simpleRestProvider,
  getList: async (params) => {
    const current = params.pagination?.currentPage ?? 1;
    const pageSize = params.pagination?.pageSize ?? 10;

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
};
