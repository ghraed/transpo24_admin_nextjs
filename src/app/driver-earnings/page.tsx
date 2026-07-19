"use client";

import React from "react";
import { useCustom, useCustomMutation } from "@refinedev/core";
import { AlertTriangle, Coins, Loader2, RotateCcw } from "lucide-react";
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

export default function DriverEarningsPage() {
  const [view, setView] = React.useState<DriverEarningsView>("all");
  const [page, setPage] = React.useState(1);
  const [retryingTripId, setRetryingTripId] = React.useState<string | null>(null);

  const { query, result } = useCustom<DriverEarningsResponse>({
    url: `/admin/driver-earnings?page=${page}&limit=${PAGE_SIZE}&view=${view}`,
    method: "get",
    dataProviderName: "adminDriverEarnings",
  });
  const { mutate } = useCustomMutation();

  const response = result.data;
  const items = response?.items ?? [];
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

      <Card className="rounded-[1.75rem] border-white/55 bg-card/86 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
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
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {total} row{total === 1 ? "" : "s"}
            </Badge>
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
              <div className="overflow-hidden rounded-[1.5rem] border border-white/50">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow>
                      <TableHead className="px-4">Driver</TableHead>
                      <TableHead className="px-4">Trip</TableHead>
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
    <Card className="rounded-[1.5rem] border-white/55 bg-card/86 shadow-[0_18px_45px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
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
