import type { DocumentStatus, DriverReviewVehicle, ReviewStatus } from "./types";
import { API_URL } from "@/lib/api/config";

export function toAbsoluteDocumentUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

export function statusBadgeVariant(status: ReviewStatus | DocumentStatus | DriverReviewVehicle["status"]) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

export function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, { hourCycle: "h23" });
}

export function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
