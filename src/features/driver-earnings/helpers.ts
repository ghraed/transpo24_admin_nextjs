import type {
  DriverEarningAdminItem,
  DriverEarningsView
} from "./types";
export const PAGE_SIZE = 20;

export const VIEW_OPTIONS: Array<{ value: DriverEarningsView; label: string }> = [
  { value: "all", label: "All queue items" },
  { value: "pending", label: "Pending hold" },
  { value: "active", label: "Ready / queued" },
  { value: "failed", label: "Failed" },
  { value: "paid", label: "Paid out" },
];

export function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString(undefined, { hourCycle: "h23" });
}

export function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function newestRecordTimestamp(item: DriverEarningAdminItem): number {
  return Math.max(
    toTimestamp(item.lastPayoutAttemptAt),
    toTimestamp(item.nextPayoutRetryAt),
    toTimestamp(item.paidOutAt),
    toTimestamp(item.availableAt),
  );
}

export function earningStatusVariant(status: DriverEarningAdminItem["earningStatus"]) {
  if (status === "PAID_OUT") return "default";
  if (status === "AVAILABLE") return "secondary";
  return "outline";
}

export function payoutStateVariant(state: DriverEarningAdminItem["driverPayoutState"]) {
  if (state === "PAID_OUT") return "default";
  if (state === "TRANSFER_FAILED") return "destructive";
  if (state === "PENDING_TRANSFER") return "secondary";
  return "outline";
}

export function formatSavedCardSummary(
  paymentMethod: DriverEarningAdminItem["additionalCharges"][number]["savedPaymentMethod"],
): string {
  if (!paymentMethod) {
    return "Saved card";
  }

  const brand = paymentMethod.brand?.toUpperCase() ?? "CARD";
  const last4 = paymentMethod.last4 ?? "----";
  return `${brand} •••• ${last4}`;
}

export function formatAdditionalChargePaymentOption(
  charge: DriverEarningAdminItem["additionalCharges"][number],
): string {
  if (charge.paymentOption === "CASH_ON_DELIVERY") {
    return "Cash on delivery";
  }

  if (charge.paymentOption === "SAVED_CARD") {
    return formatSavedCardSummary(charge.savedPaymentMethod);
  }

  return "Awaiting customer choice";
}
