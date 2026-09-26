import type {
  ReconciliationJobRun,
  ReconciliationRecord,
  ReconciliationStatus,
  ReconciliationStream
} from "./types";
export const PAGE_SIZE = 20;

export const STREAM_OPTIONS: Array<{ value: ReconciliationStream; label: string }> = [
  { value: "all", label: "All records" },
  { value: "wallet", label: "Wallet" },
  { value: "captures", label: "Captures" },
  { value: "refunds", label: "Refunds" },
  { value: "transfers", label: "Transfers" },
];

export const STATUS_OPTIONS: Array<{ value: ReconciliationStatus; label: string }> = [
  { value: "all", label: "All states" },
  { value: "mismatch", label: "Mismatch" },
  { value: "missing", label: "Missing" },
  { value: "failed", label: "Failed" },
  { value: "matched", label: "Matched" },
];

export function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(undefined, { hourCycle: "h23" });
}

export function formatAmount(value: number | null, currency: string): string {
  if (value === null) {
    return "-";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function streamVariant(stream: ReconciliationRecord["stream"]) {
  if (stream === "wallet") return "secondary";
  if (stream === "captures") return "outline";
  if (stream === "refunds") return "destructive";
  return "default";
}

export function statusVariant(status: ReconciliationRecord["status"]) {
  if (status === "matched") return "secondary";
  if (status === "mismatch") return "destructive";
  if (status === "failed") return "destructive";
  return "outline";
}

export function runStatusVariant(status: ReconciliationJobRun["status"]) {
  if (status === "SUCCESS") return "secondary";
  if (status === "RUNNING") return "outline";
  return "destructive";
}
