export type PaymentDisputeRecordType = "TRIP_CHARGE" | "WALLET_TOP_UP";

export type PaymentDisputeView = "open" | "closed" | "manual_review";

export type PaymentDisputeParty = {
  id: string;
  userId?: string;
  name: string;
  email: string;
};

export type PaymentDisputeTrip = {
  requestId: string;
  driver: PaymentDisputeParty | null;
  driverPayoutState: string;
};

export type PaymentDisputeItem = {
  id: string;
  recordType: PaymentDisputeRecordType;
  paymentStatus: string;
  disputeStatus: string | null;
  stripeDisputeId: string | null;
  stripeChargeId: string | null;
  stripePaymentIntentId: string | null;
  amount: number;
  currency: string;
  disputeAmount: number | null;
  disputeCurrency: string | null;
  disputeReason: string | null;
  disputeCreatedAt: string | null;
  disputeUpdatedAt: string | null;
  disputeClosedAt: string | null;
  disputeEvidenceDueBy: string | null;
  requiresManualReview: boolean;
  customer: PaymentDisputeParty;
  trip: PaymentDisputeTrip | null;
  walletTopUpId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentDisputeSummary = {
  openCount: number;
  closedCount: number;
  manualReviewCount: number;
};

export type PaymentDisputesResponse = {
  items: PaymentDisputeItem[];
  total: number;
  summary: PaymentDisputeSummary;
};
