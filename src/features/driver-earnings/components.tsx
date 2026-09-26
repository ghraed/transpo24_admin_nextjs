"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronDown,
  Loader2,
  RotateCcw
} from "lucide-react";
import React from "react";
import { earningStatusVariant, formatAdditionalChargePaymentOption, formatAmount, formatDate, payoutStateVariant } from "./helpers";
import type {
  DriverEarningAdminItem
} from "./types";
export function EarningCard({ item, isRetrying, onRetry }: { item: DriverEarningAdminItem; isRetrying: boolean; onRetry: () => void }) {
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

export function EarningDetailSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/[0.18] p-4"><h4 className="font-semibold">{title}</h4>{children}</section>; }

export function DetailPair({ label, value }: { label: string; value: string }) { return <div className="grid grid-cols-[110px_1fr] gap-2 text-sm"><span className="text-muted-foreground">{label}</span><span className="break-words">{value}</span></div>; }

export function SummaryCard({
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
