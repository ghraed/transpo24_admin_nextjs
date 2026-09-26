"use client";

import axios from "axios";
import Cookies from "js-cookie";
export { API_URL } from "./config";
export const axiosInstance = axios.create();

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

