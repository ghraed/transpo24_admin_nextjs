"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertTriangle,
  ChevronDown
} from "lucide-react";
import React from "react";
import { formatAmount, formatDate, statusVariant, streamVariant } from "./helpers";
import type {
  ReconciliationRecord
} from "./types";
export function ReconciliationCard({ item }: { item: ReconciliationRecord }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const primaryParty = item.customer?.name ?? item.driver?.name ?? "No linked party";

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
        <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-6">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2"><Badge variant={streamVariant(item.stream)} className="rounded-full capitalize">{item.stream}</Badge><Badge variant={statusVariant(item.status)} className="rounded-full uppercase">{item.status}</Badge><span className="font-mono text-xs text-muted-foreground">{item.reference ?? item.id}</span></div>
            <div className="grid gap-3 sm:grid-cols-3"><div><div className="text-xs text-muted-foreground">Expected / actual</div><div className="mt-1 text-base font-semibold">{formatAmount(item.expectedAmount, item.currency)} <span className="font-normal text-muted-foreground">/ {formatAmount(item.actualAmount, item.currency)}</span></div></div><div><div className="text-xs text-muted-foreground">Difference</div><div className="mt-1 text-base font-semibold">{formatAmount(item.deltaAmount, item.currency)}</div></div><div><div className="text-xs text-muted-foreground">Linked party</div><div className="mt-1 text-sm font-medium">{primaryParty}</div></div></div>
            <p className="text-sm text-muted-foreground">{item.reason ?? "No reconciliation note provided."}</p>
          </div>
          <CollapsibleTrigger asChild><Button variant="outline" className="shrink-0 rounded-full px-5">{isOpen ? "Hide details" : "Open details"}<ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} /></Button></CollapsibleTrigger>
        </div>
        <CollapsibleContent><div className="m-5 grid gap-4 border-t border-border/70 pt-5 md:m-6 xl:grid-cols-3">
          <ReconciliationDetail title="References"><DetailPair label="Internal" value={item.reference ?? item.id} /><DetailPair label="External" value={item.externalReference ?? "-"} /><DetailPair label="Trip" value={item.tripId ?? "-"} /><DetailPair label="Wallet top-up" value={item.walletTopUpId ?? "-"} /><DetailPair label="Capture" value={item.captureId ?? "-"} /><DetailPair label="Refund" value={item.refundId ?? "-"} /><DetailPair label="Transfer" value={item.transferId ?? "-"} /></ReconciliationDetail>
          <ReconciliationDetail title="Parties"><DetailPair label="Customer" value={item.customer ? `${item.customer.name} · ${item.customer.email}` : "-"} /><DetailPair label="Driver" value={item.driver ? `${item.driver.name} · ${item.driver.email}` : "-"} /><DetailPair label="Detected" value={formatDate(item.detectedAt)} /><DetailPair label="Resolved" value={formatDate(item.resolvedAt)} /></ReconciliationDetail>
          <ReconciliationDetail title="Job timeline"><DetailPair label="Job run ID" value={item.jobRunId ?? "-"} /><DetailPair label="Created" value={formatDate(item.createdAt)} /><DetailPair label="Updated" value={formatDate(item.updatedAt)} /></ReconciliationDetail>
        </div></CollapsibleContent>
      </article>
    </Collapsible>
  );
}

export function ReconciliationDetail({ title, children }: { title: string; children: React.ReactNode }) { return <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/[0.18] p-4"><h3 className="font-semibold">{title}</h3>{children}</section>; }

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

export function MetricPanel({
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
