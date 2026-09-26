import type { HttpError } from "@refinedev/core";
import axios from "axios";

export function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as {
    message?: unknown;
    error?: unknown;
    details?: unknown;
  };

  const firstString = (value: unknown): string | null => {
    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const nested = firstString(item);
        if (nested) {
          return nested;
        }
      }
      return null;
    }

    if (value && typeof value === "object") {
      const objectValue = value as Record<string, unknown>;

      for (const key of ["message", "error", "detail", "details", "reason"]) {
        const nested = firstString(objectValue[key]);
        if (nested) {
          return nested;
        }
      }

      for (const nestedValue of Object.values(objectValue)) {
        const nested = firstString(nestedValue);
        if (nested) {
          return nested;
        }
      }
    }

    return null;
  };

  return (
    firstString(candidate.message) ??
    firstString(candidate.error) ??
    firstString(candidate.details)
  );
}

export function normalizeHttpError(error: unknown): HttpError {
  if (axios.isAxiosError(error)) {
    return Object.assign(new Error(
      extractErrorMessage(error.response?.data) ||
      error.response?.statusText ||
      error.message ||
      "Request failed.",
    ), {
      statusCode: error.response?.status ?? error.status ?? 500,
      errors: error.response?.data,
    });
  }

  if (error instanceof Error) {
    return Object.assign(error, { statusCode: 500 });
  }

  return Object.assign(new Error("Request failed."), { statusCode: 500 });
}

