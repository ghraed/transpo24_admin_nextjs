export type DriverEarningsView = "all" | "pending" | "active" | "failed";

export type DriverEarningStatus = "PENDING" | "AVAILABLE" | "PAID_OUT";

export type DriverPayoutState =
  | "NOT_EARNED"
  | "EARNING_CREATED"
  | "PENDING_TRANSFER"
  | "PAID_OUT"
  | "TRANSFER_FAILED"
  | "NOT_APPLICABLE";

export type DriverEarningAdminParty = {
  id: string;
  userId?: string;
  name: string;
  email: string;
};

export type DriverEarningStripeStatus = {
  accountId: string | null;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
};

export type DriverEarningAdminItem = {
  tripId: string;
  earningId: string;
  settlementId: string;
  driver: DriverEarningAdminParty;
  customer: DriverEarningAdminParty;
  stripe: DriverEarningStripeStatus;
  netAmount: number;
  currency: string;
  earningStatus: DriverEarningStatus;
  availableAt: string | null;
  paidOutAt: string | null;
  driverPayoutState: DriverPayoutState;
  payoutAttemptCount: number;
  lastPayoutAttemptAt: string | null;
  nextPayoutRetryAt: string | null;
  payoutFailureReason: string | null;
  stripeTransferId: string | null;
  stripeTransferStatus: string | null;
  canRetry: boolean;
  retryBlockedReason: string | null;
};

export type DriverEarningAdminSummary = {
  pendingCount: number;
  activeCount: number;
  failedCount: number;
};

export type DriverEarningsResponse = {
  items: DriverEarningAdminItem[];
  total: number;
  summary: DriverEarningAdminSummary;
};
