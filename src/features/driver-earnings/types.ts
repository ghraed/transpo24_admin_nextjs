export type DriverEarningsView =
  | "all"
  | "pending"
  | "active"
  | "failed"
  | "paid";

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

export type DriverEarningAdditionalChargePaymentMethod = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
};

export type DriverEarningAdditionalCharge = {
  id: string;
  amount: number;
  appFeeAmount: number;
  totalChargeAmount: number;
  currency: string;
  status: string;
  paymentOption: "SAVED_CARD" | "CASH_ON_DELIVERY" | null;
  savedPaymentMethod: DriverEarningAdditionalChargePaymentMethod | null;
  createdAt: string;
};

export type DriverEarningAdminItem = {
  tripId: string;
  earningId: string;
  settlementId: string;
  driver: DriverEarningAdminParty;
  customer: DriverEarningAdminParty;
  stripe: DriverEarningStripeStatus;
  grossAmount: number;
  platformFeeAmount: number;
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
  additionalCharges: DriverEarningAdditionalCharge[];
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
