export type ReconciliationStream =
  | "all"
  | "wallet"
  | "captures"
  | "refunds"
  | "transfers";

export type ReconciliationStatus =
  | "all"
  | "matched"
  | "mismatch"
  | "missing"
  | "failed";

export type ReconciliationRunStatus =
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "RUNNING";

export type ReconciliationSummary = {
  walletCount: number;
  captureCount: number;
  refundCount: number;
  transferCount: number;
  mismatchCount: number;
  failedJobCount: number;
};

export type ReconciliationJobRun = {
  id: string;
  stream: Exclude<ReconciliationStream, "all">;
  status: ReconciliationRunStatus;
  startedAt: string | null;
  finishedAt: string | null;
  scannedCount: number;
  matchedCount: number;
  mismatchCount: number;
  missingCount: number;
  errorMessage: string | null;
};

export type ReconciliationRecordParty = {
  id: string | null;
  name: string | null;
  email: string | null;
};

export type ReconciliationRecord = {
  id: string;
  stream: Exclude<ReconciliationStream, "all">;
  status: Exclude<ReconciliationStatus, "all">;
  currency: string;
  expectedAmount: number | null;
  actualAmount: number | null;
  deltaAmount: number | null;
  reference: string | null;
  externalReference: string | null;
  tripId: string | null;
  walletTopUpId: string | null;
  transferId: string | null;
  refundId: string | null;
  captureId: string | null;
  customer: ReconciliationRecordParty | null;
  driver: ReconciliationRecordParty | null;
  reason: string | null;
  jobRunId: string | null;
  detectedAt: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PaymentsReconciliationResponse = {
  items: ReconciliationRecord[];
  total: number;
  summary: ReconciliationSummary;
  latestRuns: ReconciliationJobRun[];
};

export type RunPaymentsReconciliationResponse = {
  runs: ReconciliationJobRun[];
};
