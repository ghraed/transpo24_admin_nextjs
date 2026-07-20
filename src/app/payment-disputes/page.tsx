"use client";

import React from "react";
import { useCustom } from "@refinedev/core";
import { AlertTriangle, BadgeAlert, Loader2, Wallet } from "lucide-react";

import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  PaymentDisputeItem,
  PaymentDisputesResponse,
  PaymentDisputeView,
} from "./types";

const PAGE_SIZE = 20;
const VIEW_OPTIONS: Array<{ value: PaymentDisputeView; label: string }> = [
  { value: "open", label: "Open disputes" },
  { value: "manual_review", label: "Manual review" },
  { value: "closed", label: "Closed" },
];

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function formatAmount(value: number | null, currency: string | null): string {
  if (value === null || !currency) {
    return "-";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function recordBadge(item: PaymentDisputeItem) {
  if (item.recordType === "TRIP_CHARGE") {
    return (
      <Badge variant="outline" className="gap-1 rounded-full px-2.5 py-1">
        <BadgeAlert className="h-3.5 w-3.5" />
        Trip charge
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="gap-1 rounded-full px-2.5 py-1">
      <Wallet className="h-3.5 w-3.5" />
      Wallet top-up
    </Badge>
  );
}

export default function PaymentDisputesPage() {
  const [view, setView] = React.useState<PaymentDisputeView>("open");
  const [page, setPage] = React.useState(1);

  const { query, result } = useCustom<PaymentDisputesResponse>({
    url: `/admin/payments/disputes?page=${page}&limit=${PAGE_SIZE}&view=${view}`,
    method: "get",
    dataProviderName: "adminPaymentDisputes",
  });

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

  return (
    <ListView className="gap-6">
      <ListViewHeader title="Payment Disputes" canCreate={false} />

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Open"
          description="Active disputes that are still under review with Stripe or operations."
          value={summary?.openCount ?? 0}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <SummaryCard
          title="Manual review"
          description="Records that need manual follow-up before payout or wallet reconciliation."
          value={summary?.manualReviewCount ?? 0}
          icon={<BadgeAlert className="h-4 w-4" />}
        />
        <SummaryCard
          title="Closed"
          description="Disputes that Stripe has already closed."
          value={summary?.closedCount ?? 0}
          icon={<Wallet className="h-4 w-4" />}
        />
      </section>

      <Card className="rounded-[1.75rem] border-white/55 bg-card/86 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl tracking-[-0.03em]">
                Stripe disputes
              </CardTitle>
              <CardDescription className="mt-2 max-w-3xl leading-6">
                Review trip charge and wallet top-up disputes without leaving the admin dashboard.
              </CardDescription>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {total} row{total === 1 ? "" : "s"}
            </Badge>
          </div>

          <Tabs
            value={view}
            onValueChange={(value) => {
              setView(value as PaymentDisputeView);
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
              Loading payment disputes...
            </div>
          ) : null}

          {query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm text-destructive">
              {query.error instanceof Error ? query.error.message : "Request failed."}
            </div>
          ) : null}

          {!query.isLoading && !query.isError && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
              No payment disputes match this view.
            </div>
          ) : null}

          {!query.isLoading && !query.isError && items.length > 0 ? (
            <>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/50">
                <Table>
                  <TableHeader className="bg-muted/45">
                    <TableRow>
                      <TableHead className="px-4">Record</TableHead>
                      <TableHead className="px-4">Customer</TableHead>
                      <TableHead className="px-4">Amount</TableHead>
                      <TableHead className="px-4">Dispute</TableHead>
                      <TableHead className="px-4">Reference</TableHead>
                      <TableHead className="px-4">Payout</TableHead>
                      <TableHead className="px-4">Timeline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="align-top">
                        <TableCell className="space-y-2 px-4 py-4">
                          {recordBadge(item)}
                          <div className="text-xs text-muted-foreground">
                            {item.recordType === "TRIP_CHARGE"
                              ? `Trip ${item.trip?.requestId ?? "-"}`
                              : `Top-up ${item.walletTopUpId ?? "-"}`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Stripe dispute: {item.stripeDisputeId ?? "-"}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4">
                          <div className="font-medium">{item.customer.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.customer.email}
                          </div>
                          {item.trip?.driver ? (
                            <div className="pt-2 text-xs text-muted-foreground">
                              Driver: {item.trip.driver.name}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4">
                          <div className="font-medium">
                            {formatAmount(item.amount, item.currency)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Disputed: {formatAmount(item.disputeAmount, item.disputeCurrency)}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-2 px-4 py-4">
                          <Badge
                            variant={item.requiresManualReview ? "destructive" : "secondary"}
                            className="rounded-full"
                          >
                            {item.disputeStatus ?? item.paymentStatus}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Reason: {item.disputeReason ?? "-"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Evidence due: {formatDate(item.disputeEvidenceDueBy)}
                          </div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4 text-xs text-muted-foreground">
                          <div>PI: {item.stripePaymentIntentId ?? "-"}</div>
                          <div>Charge: {item.stripeChargeId ?? "-"}</div>
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4 text-xs text-muted-foreground">
                          {item.trip ? (
                            <>
                              <div>State: {item.trip.driverPayoutState}</div>
                              <div>Status: {item.paymentStatus}</div>
                            </>
                          ) : (
                            <div>Wallet top-up</div>
                          )}
                        </TableCell>
                        <TableCell className="space-y-1 px-4 py-4 text-xs text-muted-foreground">
                          <div>Created: {formatDate(item.disputeCreatedAt)}</div>
                          <div>Updated: {formatDate(item.disputeUpdatedAt)}</div>
                          <div>Closed: {formatDate(item.disputeClosedAt)}</div>
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
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
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
    <Card className="rounded-[1.5rem] border-white/55 bg-card/86 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="text-sm font-medium tracking-[-0.02em]">
            {title}
          </CardTitle>
          <CardDescription className="text-xs leading-5">
            {description}
          </CardDescription>
        </div>
        <div className="rounded-full border border-white/70 bg-background/75 p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-[-0.04em]">{value}</div>
      </CardContent>
    </Card>
  );
}
