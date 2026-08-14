"use client";

import React from "react";
import { useCustom, useCustomMutation } from "@refinedev/core";
import {
  AlertTriangle,
  ChevronDown,
  Coins,
  Loader2,
  RefreshCcw,
  RotateCcw,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  DriverEarningAdminItem,
  DriverEarningsResponse,
  DriverEarningsView,
} from "./types";

const PAGE_SIZE = 20;
const VIEW_OPTIONS: Array<{ value: DriverEarningsView; label: string }> = [
  { value: "all", label: "All queue items" },
  { value: "pending", label: "Pending hold" },
  { value: "active", label: "Ready / queued" },
  { value: "failed", label: "Failed" },
  { value: "paid", label: "Paid out" },
];

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function formatAmount(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function toTimestamp(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function newestRecordTimestamp(item: DriverEarningAdminItem): number {
  return Math.max(
    toTimestamp(item.lastPayoutAttemptAt),
    toTimestamp(item.nextPayoutRetryAt),
    toTimestamp(item.paidOutAt),
    toTimestamp(item.availableAt),
  );
}

function earningStatusVariant(status: DriverEarningAdminItem["earningStatus"]) {
  if (status === "PAID_OUT") return "default";
  if (status === "AVAILABLE") return "secondary";
  return "outline";
}

function payoutStateVariant(state: DriverEarningAdminItem["driverPayoutState"]) {
  if (state === "PAID_OUT") return "default";
  if (state === "TRANSFER_FAILED") return "destructive";
  if (state === "PENDING_TRANSFER") return "secondary";
  return "outline";
}

function formatSavedCardSummary(
  paymentMethod: DriverEarningAdminItem["additionalCharges"][number]["savedPaymentMethod"],
): string {
  if (!paymentMethod) {
    return "Saved card";
  }

  const brand = paymentMethod.brand?.toUpperCase() ?? "CARD";
  const last4 = paymentMethod.last4 ?? "----";
  return `${brand} •••• ${last4}`;
}

function formatAdditionalChargePaymentOption(
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

export default function DriverEarningsPage() {
  const [view, setView] = React.useState<DriverEarningsView>("all");
  const [page, setPage] = React.useState(1);
  const [retryingTripId, setRetryingTripId] = React.useState<string | null>(null);

  const { query, result } = useCustom<DriverEarningsResponse>({
    url: `/admin/driver-earnings?page=${page}&limit=${PAGE_SIZE}&view=${view}`,
    method: "get",
    dataProviderName: "adminDriverEarnings",
    queryOptions: {
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const { mutate } = useCustomMutation();

  const response = result.data;
  const items = [...(response?.items ?? [])].sort(
    (left, right) => newestRecordTimestamp(right) - newestRecordTimestamp(left),
  );
  const summary = response?.summary;
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleRetry = (item: DriverEarningAdminItem) => {
    setRetryingTripId(item.tripId);

    mutate(
      {
        url: `/admin/driver-earnings/${item.tripId}/retry-payout`,
        method: "post",
        values: {},
        dataProviderName: "adminDriverEarnings",
      },
      {
        onSuccess: () => {
          toast.success(`Queued payout retry for trip ${item.tripId}.`);
          void query.refetch();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to queue the payout retry.",
          );
        },
        onSettled: () => {
          setRetryingTripId(null);
        },
      },
    );
  };

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

function EarningCard({ item, isRetrying, onRetry }: { item: DriverEarningAdminItem; isRetrying: boolean; onRetry: () => void }) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.driver.name}</h3><Badge className="rounded-full" variant={earningStatusVariant(item.earningStatus)}>{item.earningStatus.replaceAll("_", " ")}</Badge><Badge className="rounded-full" variant={payoutStateVariant(item.driverPayoutState)}>{item.driverPayoutState.replaceAll("_", " ")}</Badge></div>
            <div className="grid gap-3 sm:grid-cols-3"><div><div className="text-xs text-muted-foreground">Driver earning</div><div className="mt-1 text-xl font-semibold tracking-[-0.03em]">{formatAmount(item.netAmount, item.currency)}</div></div><div><div className="text-xs text-muted-foreground">Trip</div><div className="mt-1 font-mono text-xs">{item.tripId}</div><div className="mt-1 text-xs text-muted-foreground">{item.customer.name}</div></div><div><div className="text-xs text-muted-foreground">Available at</div><div className="mt-1 text-sm">{formatDate(item.availableAt)}</div></div></div>
            <div className="flex flex-wrap gap-2"><Badge variant={item.stripe.payoutsEnabled ? "default" : "secondary"}>{item.stripe.payoutsEnabled ? "Payouts enabled" : "Payouts disabled"}</Badge><Badge variant={item.stripe.detailsSubmitted ? "outline" : "secondary"}>{item.stripe.detailsSubmitted ? "Details submitted" : "Details incomplete"}</Badge><span className="text-xs text-muted-foreground">{item.payoutAttemptCount} payout attempt{item.payoutAttemptCount === 1 ? "" : "s"}</span></div>
          </div>
          <div className="flex flex-wrap gap-2"><CollapsibleTrigger asChild><Button variant="outline" className="rounded-full px-5">{isOpen ? "Hide details" : "Open details"}<ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></Button></CollapsibleTrigger>{item.canRetry ? <Button variant="outline" className="rounded-full px-5" disabled={isRetrying} onClick={onRetry}>{isRetrying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Retry payout</Button> : null}</div>
        </div>
        <CollapsibleContent><div className="m-5 grid gap-4 border-t border-border/70 pt-5 md:m-6 xl:grid-cols-3">
          <EarningDetailSection title="Payout details"><DetailPair label="Gross amount" value={formatAmount(item.grossAmount, item.currency)} /><DetailPair label="Platform fee" value={formatAmount(item.platformFeeAmount, item.currency)} /><DetailPair label="Net amount" value={formatAmount(item.netAmount, item.currency)} /><DetailPair label="Last attempt" value={formatDate(item.lastPayoutAttemptAt)} /><DetailPair label="Next retry" value={formatDate(item.nextPayoutRetryAt)} /></EarningDetailSection>
          <EarningDetailSection title="Transfer diagnostics"><DetailPair label="Transfer ID" value={item.stripeTransferId ?? "-"} /><DetailPair label="Stripe status" value={item.stripeTransferStatus ?? "-"} />{item.payoutFailureReason ? <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{item.payoutFailureReason}</div> : <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm text-muted-foreground">No payout failure reason recorded.</div>}{!item.canRetry ? <p className="text-sm text-muted-foreground">{item.retryBlockedReason ?? "Retry is not available."}</p> : null}</EarningDetailSection>
          <EarningDetailSection title="Additional charges">{item.additionalCharges.length ? item.additionalCharges.map((charge) => <div key={charge.id} className="rounded-xl border border-border/70 bg-background p-3 text-sm"><div className="font-medium">{formatAmount(charge.totalChargeAmount, charge.currency)}</div><div className="mt-1 text-muted-foreground">{charge.status} · {formatAdditionalChargePaymentOption(charge)}</div><div className="mt-1 text-xs text-muted-foreground">Added {formatDate(charge.createdAt)}</div></div>) : <div className="rounded-xl border border-dashed border-border/80 px-3 py-4 text-sm text-muted-foreground">No additional charges.</div>}</EarningDetailSection>
        </div></CollapsibleContent>
      </article>
    </Collapsible>
  );
}

function EarningDetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/[0.18] p-4"><h4 className="font-semibold">{title}</h4>{children}</section>; }
function DetailPair({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[110px_1fr] gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="break-words">{value}</span></div>; }

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
    <Card className="rounded-3xl border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold">{title}</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <CardTitle className="text-3xl tracking-[-0.04em]">{value}</CardTitle>
        <CardDescription className="leading-6">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}
