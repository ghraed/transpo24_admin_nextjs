"use client";

import axios from "axios";
import dataProviderSimpleRest from "@refinedev/simple-rest";
import type { DataProviders } from "@refinedev/core";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const axiosInstance = axios.create();

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
      const start = Math.max(current - 1, 0) * pageSize;

      const { data, headers } = await axiosInstance.get(
        `${API_URL}/admin/users`,
        {
          params: {
            _start: start,
            _end: start + pageSize,
          },
        }
      );

      const total = parseInt(headers["x-total-count"] ?? data.length, 10);

      return {
        data,
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
    getApiUrl: () => API_URL,
  },
};
