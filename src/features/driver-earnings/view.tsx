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
  AlertTriangle,
  Coins,
  Loader2,
  RefreshCcw,
  RotateCcw
} from "lucide-react";
import { EarningCard, SummaryCard } from "./components";
import { VIEW_OPTIONS, earningStatusVariant, formatAdditionalChargePaymentOption, formatAmount, formatDate, formatSavedCardSummary, payoutStateVariant } from "./helpers";
import type {
  DriverEarningsView
} from "./types";
import { useDriverEarnings } from "./use-driver-earnings";

export default function DriverEarningsPage() {
  const { view, setView, page, setPage, retryingTripId, query, items, summary, total, totalPages, handleRetry } = useDriverEarnings();
  return (
    <ListView className="gap-6">
      <ListViewHeader title="Driver Earnings" canCreate={false} />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Pending hold"
          description="Earnings still inside the 24-hour delay before payout becomes eligible."
          value={summary?.pendingCount ?? 0}
          icon={<Coins className="h-4 w-4" />}
        />
        <SummaryCard
          title="Ready / queued"
          description="Due payouts that are waiting, queued, or being retried."
          value={summary?.activeCount ?? 0}
          icon={<Loader2 className="h-4 w-4" />}
        />
        <SummaryCard
          title="Failed"
          description="Transfers that failed and need automatic or manual follow-up."
          value={summary?.failedCount ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
      </section>

      <Card className="rounded-3xl border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl tracking-[-0.03em]">
                Driver payout queue
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl leading-6">
                Review pending hold rows, active payout work, and failed Stripe transfers in one queue.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={query.isFetching}
                onClick={() => {
                  void query.refetch();
                }}
              >
                <RefreshCcw
                  className={`h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Badge variant="outline" className="rounded-full px-3 py-1">
                {total} row{total === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>

          <Tabs
            value={view}
            onValueChange={(value) => {
              setView(value as DriverEarningsView);
              setPage(1);
            }}
          >
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-2xl bg-muted/60 p-1">
              {VIEW_OPTIONS.map((option) => (
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
              Loading driver earnings queue...
            </div>
          ) : null}

          {query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {query.error instanceof Error
                ? query.error.message
                : "Failed to load driver earnings."}
            </div>
          ) : null}

          {!query.isLoading && !query.isError && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No driver earnings match this queue view.
            </div>
          ) : null}

          {!query.isLoading && !query.isError && items.length > 0 ? (
            <>
              <div className="hidden overflow-hidden rounded-[1.5rem] border border-white/50">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow>
                      <TableHead className="px-4">Driver</TableHead>
                      <TableHead className="px-4">Trip</TableHead>
                      <TableHead className="px-4">Gross</TableHead>
                      <TableHead className="px-4">Platform Fee</TableHead>
                      <TableHead className="px-4">Amount</TableHead>
                      <TableHead className="px-4">Earning</TableHead>
                      <TableHead className="px-4">Payout</TableHead>
                      <TableHead className="px-4">Available At</TableHead>
                      <TableHead className="px-4">Last Attempt</TableHead>
                      <TableHead className="px-4">Next Retry</TableHead>
                      <TableHead className="px-4">Diagnostics</TableHead>
                      <TableHead className="px-4 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.earningId} className="align-top">
                        <TableCell className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-medium">{item.driver.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.driver.email}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Badge
                                variant={
                                  item.stripe.payoutsEnabled ? "default" : "secondary"
                                }
                              >
                                {item.stripe.payoutsEnabled
                                  ? "Payouts enabled"
                                  : "Payouts disabled"}
                              </Badge>
                              <Badge
                                variant={
                                  item.stripe.detailsSubmitted
                                    ? "outline"
                                    : "secondary"
                                }
                              >
                                {item.stripe.detailsSubmitted
                                  ? "Details submitted"
                                  : "Details incomplete"}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="space-y-1">
                            <div className="font-mono text-xs">{item.tripId}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.customer.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.customer.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-medium">
                          {formatAmount(item.grossAmount, item.currency)}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-medium">
                          {formatAmount(item.platformFeeAmount, item.currency)}
                        </TableCell>
                        <TableCell className="px-4 py-4 font-medium">
                          {formatAmount(item.netAmount, item.currency)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge variant={earningStatusVariant(item.earningStatus)}>
                            {item.earningStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="space-y-2">
                            <Badge variant={payoutStateVariant(item.driverPayoutState)}>
                              {item.driverPayoutState}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              Attempts: {item.payoutAttemptCount}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(item.availableAt)}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(item.lastPayoutAttemptAt)}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                          {formatDate(item.nextPayoutRetryAt)}
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="max-w-[22rem] space-y-2 text-xs text-muted-foreground">
                            {item.payoutFailureReason ? (
                              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                                {item.payoutFailureReason}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2">
                                No payout failure reason recorded.
                              </div>
                            )}
                            <div>Transfer ID: {item.stripeTransferId ?? "-"}</div>
                            <div>Stripe status: {item.stripeTransferStatus ?? "-"}</div>
                            {item.additionalCharges.length > 0 ? (
                              <div className="space-y-2">
                                {item.additionalCharges.map((charge) => (
                                  <div
                                    key={charge.id}
                                    className="rounded-xl border border-border/70 bg-background/60 px-3 py-2"
                                  >
                                    <div className="font-medium text-foreground">
                                      Additional charge{" "}
                                      {formatAmount(
                                        charge.totalChargeAmount,
                                        charge.currency,
                                      )}
                                    </div>
                                    <div>Status: {charge.status}</div>
                                    <div>
                                      Payment:{" "}
                                      {formatAdditionalChargePaymentOption(charge)}
                                    </div>
                                    {charge.paymentOption === "SAVED_CARD" &&
                                      charge.savedPaymentMethod ? (
                                      <div>
                                        Card:{" "}
                                        {formatSavedCardSummary(
                                          charge.savedPaymentMethod,
                                        )}
                                      </div>
                                    ) : null}
                                    <div>Added: {formatDate(charge.createdAt)}</div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-right">
                          {item.canRetry ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              disabled={retryingTripId === item.tripId}
                              onClick={() => handleRetry(item)}
                            >
                              {retryingTripId === item.tripId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              Retry payout
                            </Button>
                          ) : (
                            <div className="max-w-[14rem] text-left text-xs text-muted-foreground">
                              {item.retryBlockedReason ?? "Retry is not available."}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <section className="grid gap-4">
                {items.map((item) => (
                  <EarningCard
                    key={item.earningId}
                    item={item}
                    isRetrying={retryingTripId === item.tripId}
                    onRetry={() => handleRetry(item)}
                  />
                ))}
              </section>

              <div className="flex flex-col gap-3 rounded-[1.25rem] border border-white/45 bg-background/70 px-4 py-3 text-sm backdrop-blur md:flex-row md:items-center md:justify-between">
                <div className="text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </ListView>
  );
}
