"use client";

import React from "react";
import { useCustom, useCustomMutation } from "@refinedev/core";
import {
  AlertTriangle,
  ArrowLeftRight,
  CreditCard,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PaymentsReconciliationResponse,
  ReconciliationJobRun,
  ReconciliationRecord,
  ReconciliationStatus,
  ReconciliationStream,
  RunPaymentsReconciliationResponse,
} from "./types";

const PAGE_SIZE = 20;
const STREAM_OPTIONS: Array<{ value: ReconciliationStream; label: string }> = [
  { value: "all", label: "All records" },
  { value: "wallet", label: "Wallet" },
  { value: "captures", label: "Captures" },
  { value: "refunds", label: "Refunds" },
  { value: "transfers", label: "Transfers" },
];
const STATUS_OPTIONS: Array<{ value: ReconciliationStatus; label: string }> = [
  { value: "all", label: "All states" },
  { value: "mismatch", label: "Mismatch" },
  { value: "missing", label: "Missing" },
  { value: "failed", label: "Failed" },
  { value: "matched", label: "Matched" },
];

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function formatAmount(value: number | null, currency: string): string {
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

function streamVariant(stream: ReconciliationRecord["stream"]) {
  if (stream === "wallet") return "secondary";
  if (stream === "captures") return "outline";
  if (stream === "refunds") return "destructive";
  return "default";
}

function statusVariant(status: ReconciliationRecord["status"]) {
  if (status === "matched") return "secondary";
  if (status === "mismatch") return "destructive";
  if (status === "failed") return "destructive";
  return "outline";
}

function runStatusVariant(status: ReconciliationJobRun["status"]) {
  if (status === "SUCCESS") return "secondary";
  if (status === "RUNNING") return "outline";
  return "destructive";
}

export default function PaymentsReconciliationPage() {
  const [stream, setStream] = React.useState<ReconciliationStream>("all");
  const [status, setStatus] = React.useState<ReconciliationStatus>("all");
  const [page, setPage] = React.useState(1);
  const [isRunning, setIsRunning] = React.useState(false);

  const { query, result } = useCustom<PaymentsReconciliationResponse>({
    url: `/admin/payments/reconciliation?page=${page}&limit=${PAGE_SIZE}&stream=${stream}&status=${status}`,
    method: "get",
    dataProviderName: "adminPaymentsReconciliation",
  });
  const { mutate } = useCustomMutation();

  const response = result.data;
  const items = response?.items ?? [];
  const latestRuns = response?.latestRuns ?? [];
  const summary = response?.summary;
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleRun = () => {
    setIsRunning(true);

    mutate(
      {
        url: "/admin/payments/reconciliation/run",
        method: "post",
        values: { stream: "all" },
        dataProviderName: "adminPaymentsReconciliation",
      },
      {
        onSuccess: (response) => {
          const runs =
            (response?.data as RunPaymentsReconciliationResponse | undefined)?.runs ??
            [];
          toast.success(
            runs.length > 0
              ? `Completed ${runs.length} reconciliation job${runs.length === 1 ? "" : "s"}.`
              : "Payments reconciliation completed.",
          );
          void query.refetch();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to run payments reconciliation.",
          );
        },
        onSettled: () => {
          setIsRunning(false);
        },
      },
    );
  };

  return (
    <ListView className="gap-6">
      <ListViewHeader title="Payments Reconciliation" canCreate={false} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Wallet"
          description="Top-ups and wallet movements checked against recorded funding results."
          value={summary?.walletCount ?? 0}
          icon={<Wallet className="h-4 w-4" />}
        />
        <SummaryCard
          title="Captures"
          description="Captured holds compared against trip records and settlement rows."
          value={summary?.captureCount ?? 0}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <SummaryCard
          title="Refunds"
          description="Refund states validated against Stripe ids or wallet refund transactions."
          value={summary?.refundCount ?? 0}
          icon={<RefreshCcw className="h-4 w-4" />}
        />
        <SummaryCard
          title="Transfers"
          description="Driver payout transfers checked against earning and settlement state."
          value={summary?.transferCount ?? 0}
          icon={<ArrowLeftRight className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-[1.75rem] border-white/55 bg-card/86 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader className="gap-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-xl tracking-[-0.03em]">
                  Exception pressure
                </CardTitle>
                <CardDescription className="mt-2 leading-6">
                  Re-run the reconciliation jobs after finance fixes or webhook catch-up and review the latest exception counts here.
                </CardDescription>
              </div>
              <Button
                type="button"
                onClick={handleRun}
                disabled={isRunning}
                className="rounded-full px-5"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                {isRunning ? "Running..." : "Run Reconciliation"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MetricPanel label="Mismatches" value={summary?.mismatchCount ?? 0} tone="destructive" />
            <MetricPanel label="Failed jobs" value={summary?.failedJobCount ?? 0} tone="warning" />
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-white/55 bg-card/86 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl tracking-[-0.03em]">Latest job runs</CardTitle>
            <CardDescription className="leading-6">
              Recent reconciliation runs persisted by the backend for wallet, captures, refunds, and transfers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {latestRuns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
                No reconciliation runs are available yet.
              </div>
            ) : (
              latestRuns.map((run) => (
                <div
                  key={run.id}
                  className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium capitalize">{run.stream}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Started {formatDate(run.startedAt)}
                      </div>
                    </div>
                    <Badge variant={runStatusVariant(run.status)} className="rounded-full">
                      {run.status}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>Scanned: {run.scannedCount}</div>
                    <div>Matched: {run.matchedCount}</div>
                    <div>Mismatch: {run.mismatchCount}</div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Missing: {run.missingCount} · Finished {formatDate(run.finishedAt)}
                  </div>
                  {run.errorMessage ? (
                    <div className="mt-2 text-xs text-destructive">{run.errorMessage}</div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-[1.75rem] border-white/55 bg-card/86 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl tracking-[-0.03em]">
                Reconciliation records
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl leading-6">
                Review matched, missing, mismatched, and failed payment records from the latest reconciliation runs.
              </CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {total} row{total === 1 ? "" : "s"}
            </Badge>
          </div>

          <Tabs
            value={stream}
            onValueChange={(value) => {
              setStream(value as ReconciliationStream);
              setPage(1);
            }}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted/60 p-1">
              {STREAM_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="rounded-xl px-3 py-2 text-xs sm:text-sm"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Tabs
            value={status}
            onValueChange={(value) => {
              setStatus(value as ReconciliationStatus);
              setPage(1);
            }}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted/60 p-1">
              {STATUS_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="rounded-xl px-3 py-2 text-xs sm:text-sm"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-4">
          {query.isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/70 px-4 py-5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payments reconciliation...
            </div>
          ) : null}

          {query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {query.error instanceof Error
                ? query.error.message
                : "Failed to load payments reconciliation."}
            </div>
          ) : null}

          {!query.isLoading && !query.isError && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No reconciliation records match this view.
            </div>
          ) : null}

          {!query.isLoading && !query.isError && items.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/50">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow>
                      <TableHead className="px-4">Stream</TableHead>
                      <TableHead className="px-4">Reference</TableHead>
                      <TableHead className="px-4">Parties</TableHead>
                      <TableHead className="px-4">Amounts</TableHead>
                      <TableHead className="px-4">Status</TableHead>
                      <TableHead className="px-4">Job run</TableHead>
                      <TableHead className="px-4">Timeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="align-top">
                        <TableCell className="space-y-2 px-4 py-4">
                          <Badge
                            variant={streamVariant(item.stream)}
                            className="rounded-full capitalize"
                          >
                            {item.stream}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Internal: {item.reference ?? item.id}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            External: {item.externalReference ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4 text-xs text-muted-foreground">
                          <div>Trip: {item.tripId ?? "-"}</div>
                          <div>Wallet: {item.walletTopUpId ?? "-"}</div>
                          <div>Capture: {item.captureId ?? "-"}</div>
                          <div>Refund: {item.refundId ?? "-"}</div>
                          <div>Transfer: {item.transferId ?? "-"}</div>
                        </TableCell>
                        <TableCell className="space-y-3 px-4 py-4">
                          <div>
                            <div className="font-medium">
                              {item.customer?.name ?? "No customer"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.customer?.email ?? "-"}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">
                              {item.driver?.name ?? "No driver"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.driver?.email ?? "-"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4">
                          <div className="font-medium">
                            Expected {formatAmount(item.expectedAmount, item.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Actual {formatAmount(item.actualAmount, item.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Delta {formatAmount(item.deltaAmount, item.currency)}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-2 px-4 py-4">
                          <Badge
                            variant={statusVariant(item.status)}
                            className="rounded-full uppercase"
                          >
                            {item.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {item.reason ?? "No reconciliation note provided."}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4 text-xs text-muted-foreground">
                          <div>ID: {item.jobRunId ?? "-"}</div>
                          <div>Detected: {formatDate(item.detectedAt)}</div>
                          <div>Resolved: {formatDate(item.resolvedAt)}</div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4 text-xs text-muted-foreground">
                          <div>Created: {formatDate(item.createdAt)}</div>
                          <div>Updated: {formatDate(item.updatedAt)}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
                <span className="text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </ListView>
  );
}

function SummaryCard({
  title,
  description,
  value,
  icon,
}: {
  title: string;
  description: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="rounded-[1.5rem] border-white/55 bg-card/86 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-2">
          <CardDescription>{title}</CardDescription>
          <CardTitle className="text-3xl tracking-[-0.04em]">{value}</CardTitle>
        </div>
        <div className="rounded-2xl border border-border/70 bg-background/75 p-2.5">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MetricPanel({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "destructive" | "warning";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
      <div className="flex items-center gap-2">
        <AlertTriangle
          className={
            tone === "destructive"
              ? "h-4 w-4 text-destructive"
              : "h-4 w-4 text-amber-500"
          }
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{value}</div>
    </div>
  );
}
