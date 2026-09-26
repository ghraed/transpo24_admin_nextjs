"use client";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeftRight,
  CreditCard,
  Loader2,
  RefreshCcw,
  RotateCcw,
  Wallet
} from "lucide-react";
import { MetricPanel, ReconciliationCard, SummaryCard } from "./components";
import { STATUS_OPTIONS, STREAM_OPTIONS, formatAmount, formatDate, runStatusVariant, statusVariant, streamVariant } from "./helpers";
import type {
  ReconciliationStatus,
  ReconciliationStream
} from "./types";
import { usePaymentsReconciliation } from "./use-payments-reconciliation";

export default function PaymentsReconciliationPage() {
  const { stream, setStream, status, setStatus, page, setPage, isRunning, query, items, latestRuns, summary, total, totalPages, handleRun } = usePaymentsReconciliation();
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
        <Card className="rounded-3xl border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
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

        <Card className="rounded-3xl border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
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

      <Card className="rounded-3xl border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
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
              <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/50">
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

              <section className="grid gap-4">
                {items.map((item) => <ReconciliationCard key={item.id} item={item} />)}
              </section>

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
