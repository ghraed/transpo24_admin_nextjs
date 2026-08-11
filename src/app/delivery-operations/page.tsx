"use client";

import React from "react";
import { useCustom } from "@refinedev/core";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileImage,
  MapPin,
  PackageCheck,
  Route,
  Search,
  Send,
  Truck,
  UserRound,
} from "lucide-react";

import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DeliveryOperation, DeliveryOperationsResponse, DeliveryOperationsView } from "./types";

const PAGE_SIZE = 20;
const views: Array<{ value: DeliveryOperationsView; label: string }> = [
  { value: "all", label: "All requests" },
  { value: "active", label: "In progress" },
  { value: "unassigned", label: "Needs driver" },
  { value: "completed", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

function formatAmount(value: number | null, currency: string | null) {
  if (value === null || !currency) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function label(value: string | null) {
  return value ? value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "—";
}

function statusVariant(status: string) {
  if (["COMPLETED", "DELIVERED", "ACCEPTED"].includes(status)) return "default" as const;
  if (["CANCELLED", "REJECTED", "EXPIRED"].includes(status)) return "destructive" as const;
  if (["IN_TRANSIT", "DRIVER_GOING_TO_DROPOFF", "ITEM_PICKED_UP"].includes(status)) return "secondary" as const;
  return "outline" as const;
}

export default function DeliveryOperationsPage() {
  const [view, setView] = React.useState<DeliveryOperationsView>("all");
  const [page, setPage] = React.useState(1);
  const [searchDraft, setSearchDraft] = React.useState("");
  const [search, setSearch] = React.useState("");

  const queryString = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), view });
  if (search) queryString.set("search", search);
  const { query, result } = useCustom<DeliveryOperationsResponse>({
    url: `/admin/delivery-operations?${queryString.toString()}`,
    method: "get",
    dataProviderName: "adminDeliveryOperations",
    queryOptions: { refetchInterval: 30_000, refetchOnWindowFocus: true },
  });
  const response = result.data;
  const totalPages = Math.max(1, Math.ceil((response?.total ?? 0) / PAGE_SIZE));

  React.useEffect(() => setPage(1), [view, search]);
  React.useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <ListView className="gap-6">
      <ListViewHeader title="Delivery Operations" canCreate={false} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="All requests" value={response?.summary?.total ?? 0} icon={<ClipboardList className="h-4 w-4" />} />
        <SummaryCard title="In progress" value={response?.summary?.active ?? 0} icon={<Truck className="h-4 w-4" />} accent="text-sky-600" />
        <SummaryCard title="Needs driver" value={response?.summary?.unassigned ?? 0} icon={<UserRound className="h-4 w-4" />} accent="text-amber-600" />
        <SummaryCard title="Delivered" value={response?.summary?.completed ?? 0} icon={<PackageCheck className="h-4 w-4" />} accent="text-emerald-600" />
      </section>

      <Card className="rounded-3xl border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
        <CardHeader className="gap-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle className="text-xl tracking-[-0.03em]">Request relationship tracker</CardTitle>
              <CardDescription className="mt-2 max-w-3xl leading-6">
                Follow each client request from quotes sent by drivers through assignment, pickup, delivery proof, and payment state.
              </CardDescription>
            </div>
            <form className="flex w-full gap-2 lg:w-[360px]" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft.trim()); }}>
              <Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search client, driver, route or request ID" />
              <Button type="submit" variant="outline" size="icon" aria-label="Search"><Search className="h-4 w-4" /></Button>
            </form>
          </div>
          <Tabs value={view} onValueChange={(next) => setView(next as DeliveryOperationsView)}>
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-2xl bg-muted/55 p-1.5">
              {views.map((item) => <TabsTrigger key={item.value} value={item.value} className="rounded-xl px-3 py-2 text-xs sm:text-sm">{item.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {query.isLoading ? <div className="py-16 text-center text-sm text-muted-foreground">Loading delivery relationships…</div> : null}
          {query.error ? <div className="py-16 text-center text-sm text-destructive">{query.error instanceof Error ? query.error.message : "Could not load delivery operations."}</div> : null}
          {!query.isLoading && !query.error && !response?.items?.length ? <div className="py-16 text-center text-sm text-muted-foreground">No requests match this view.</div> : null}
          {response?.items?.length ? <Accordion type="single" collapsible className="divide-y rounded-2xl border bg-muted/[0.18] px-4 sm:px-5">{response.items.map((item) => <RequestRow key={item.id} item={item} />)}</Accordion> : null}
          {response?.items?.length ? <div className="mt-5 flex items-center justify-between gap-3 text-sm text-muted-foreground"><span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, response.total)} of {response.total}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}><ChevronLeft className="h-4 w-4" /> Previous</Button><Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages}>Next <ChevronRight className="h-4 w-4" /></Button></div></div> : null}
        </CardContent>
      </Card>
    </ListView>
  );
}

function SummaryCard({ title, value, icon, accent = "text-foreground" }: { title: string; value: number; icon: React.ReactNode; accent?: string }) {
  return <Card className="rounded-3xl border-border/80 shadow-[0_10px_22px_-19px_rgba(17,24,39,0.35)]"><CardContent className="flex items-center justify-between p-5"><div><div className="text-sm text-muted-foreground">{title}</div><div className={`mt-1 text-3xl font-semibold tracking-[-0.04em] ${accent}`}>{value}</div></div><div className="rounded-2xl bg-muted p-3 text-muted-foreground">{icon}</div></CardContent></Card>;
}

function RequestRow({ item }: { item: DeliveryOperation }) {
  const acceptedOffer = item.offers.find((offer) => offer.id === item.acceptedOfferId);
  return <AccordionItem value={item.id} className="border-0">
    <AccordionTrigger className="py-5 hover:no-underline">
      <div className="min-w-0 flex-1 text-left"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">#{item.id.slice(-8)}</span><Badge variant={statusVariant(item.status)} className="rounded-full">{label(item.status)}</Badge>{item.isImmediate ? <Badge variant="outline" className="rounded-full">Immediate</Badge> : null}</div><div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center"><div className="min-w-0"><div className="font-semibold">{item.customer.name}</div><div className="truncate text-xs text-muted-foreground">{item.service} · {item.item.title ?? label(item.item.type)}</div></div><RouteSummary pickup={item.route.pickupAddress} dropoff={item.route.dropoffAddress} compact /><div className="min-w-0"><div className="text-xs text-muted-foreground">{item.assignedDriver ? "Assigned driver" : "Assignment"}</div><div className="truncate text-sm font-medium">{item.assignedDriver?.name ?? "Awaiting acceptance"}</div></div><div className="text-right text-xs text-muted-foreground">{item.offers.length} offer{item.offers.length === 1 ? "" : "s"}<br />{formatDate(item.createdAt)}</div></div></div>
    </AccordionTrigger>
    <AccordionContent className="pb-6"><div className="grid gap-4 border-t pt-5 xl:grid-cols-[1.1fr_1.25fr_1fr]">
      <InfoSection title="Client request" icon={<UserRound className="h-4 w-4" />}><Party party={item.customer} /><RouteSummary pickup={item.route.pickupAddress} dropoff={item.route.dropoffAddress} /><DetailRows entries={[['Scheduled pickup', formatDate(item.scheduledPickupAt)], ['Submitted', formatDate(item.submittedAt ?? item.createdAt)], ['Item', item.item.title ?? label(item.item.type)], ['Description', item.item.description ?? '—']]} /><ItemDetails details={item.item.details} /></InfoSection>
      <InfoSection title="Offers & assignment" icon={<Send className="h-4 w-4" />}><div className="rounded-xl border bg-background p-3"><div className="text-xs font-medium text-muted-foreground">Selected driver</div>{item.assignedDriver ? <><Party party={item.assignedDriver} /><div className="mt-2 text-sm">{acceptedOffer ? `${formatAmount(acceptedOffer.price, acceptedOffer.currency)} · accepted offer` : "Assigned directly"}</div></> : <div className="mt-2 text-sm text-muted-foreground">No driver has taken this delivery.</div>}</div><div className="space-y-2">{item.offers.length ? item.offers.map((offer) => <Offer key={offer.id} offer={offer} accepted={offer.id === item.acceptedOfferId} />) : <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No driver offers sent yet.</div>}</div></InfoSection>
      <InfoSection title="Delivery & settlement" icon={<Truck className="h-4 w-4" />}><DeliveryTimeline item={item} /><div className="rounded-xl border bg-background p-3"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><CircleDollarSign className="h-4 w-4 text-muted-foreground" /> Payment</div><DetailRows entries={[["Final price", formatAmount(item.payment.finalPrice, item.payment.currency)], ["Payment", label(item.payment.status)], ["Method", label(item.payment.method)], ["Held / captured", `${formatAmount(item.payment.heldAmount, item.payment.currency)} / ${formatAmount(item.payment.capturedAmount, item.payment.currency)}`]]} /></div><Proofs item={item} /></InfoSection>
    </div></AccordionContent>
  </AccordionItem>;
}

function InfoSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <section className="space-y-3"><div className="flex items-center gap-2 text-sm font-semibold">{icon}{title}</div>{children}</section>; }
function Party({ party }: { party: { name: string; email: string; phone: string | null } }) { return <div className="mt-2"><div className="text-sm font-medium">{party.name}</div>{party.phone ? <div className="mt-1 text-xs text-muted-foreground"><span className="font-medium text-foreground/75">Phone:</span> {party.phone}</div> : null}</div>; }
function RouteSummary({ pickup, dropoff, compact = false }: { pickup: string | null; dropoff: string | null; compact?: boolean }) { return <div className={`min-w-0 ${compact ? "" : "rounded-xl border bg-background p-3"}`}><div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><div className="min-w-0 text-xs"><span className="text-muted-foreground">Pickup: </span><span className="break-words">{pickup ?? "Not set"}</span></div></div><div className="my-1 ml-2 h-3 border-l border-dashed" /><div className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" /><div className="min-w-0 text-xs"><span className="text-muted-foreground">Drop-off: </span><span className="break-words">{dropoff ?? "Not set"}</span></div></div></div>; }
function DetailRows({ entries }: { entries: Array<[string, string]> }) { return <dl className="mt-3 space-y-1.5 text-xs">{entries.map(([key, value]) => <div key={key} className="grid grid-cols-[110px_1fr] gap-2"><dt className="text-muted-foreground">{key}</dt><dd className="break-words">{value}</dd></div>)}</dl>; }
function ItemDetails({ details }: { details: DeliveryOperation['item']['details'] }) { const entries = Object.entries(details).filter(([, value]) => value !== null && value !== false).map(([key, value]) => [label(key), String(value)] as [string, string]); return entries.length ? <div className="rounded-xl border bg-background p-3"><div className="text-xs font-medium text-muted-foreground">Item details</div><DetailRows entries={entries} /></div> : null; }
function Offer({ offer, accepted }: { offer: DeliveryOperation['offers'][number]; accepted: boolean }) { return <div className={`rounded-xl border p-3 ${accepted ? "border-emerald-300 bg-emerald-50/55 dark:border-emerald-900 dark:bg-emerald-950/20" : "bg-background"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{offer.driver.name}</div><div className="truncate text-xs text-muted-foreground">{offer.driver.email}</div></div><Badge variant={statusVariant(offer.status)} className="shrink-0 rounded-full">{label(offer.status)}</Badge></div><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"><span className="font-medium">{formatAmount(offer.price, offer.currency)}</span><span className="text-muted-foreground">Sent {formatDate(offer.sentAt)}</span></div>{offer.message ? <p className="mt-2 text-xs text-muted-foreground">“{offer.message}”</p> : null}</div>; }
function DeliveryTimeline({ item }: { item: DeliveryOperation }) { const steps = [["Offer accepted", item.delivery.acceptedAt], ["At pickup", item.delivery.driverArrivedPickupAt], ["Item picked up", item.delivery.itemPickedUpAt], ["Heading to drop-off", item.delivery.driverGoingToDropoffAt], ["Delivered", item.delivery.deliveredAt], ["Completed", item.delivery.completedAt]]; return <div className="rounded-xl border bg-background p-3"><div className="mb-3 flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 text-muted-foreground" /> Delivery timeline</div><div className="space-y-2">{steps.map(([name, date]) => <div key={name} className="flex gap-2 text-xs"><CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${date ? "text-emerald-600" : "text-muted-foreground/35"}`} /><span className="w-32 text-muted-foreground">{name}</span><span>{formatDate(date)}</span></div>)}</div>{item.delivery.pickupNotes || item.delivery.deliveryNotes ? <DetailRows entries={[["Pickup note", item.delivery.pickupNotes ?? "—"], ["Delivery note", item.delivery.deliveryNotes ?? "—"]]} /> : null}</div>; }
function Proofs({ item }: { item: DeliveryOperation }) { const photos = [...item.photos, ...item.proofPhotos]; return <div className="rounded-xl border bg-background p-3"><div className="flex items-center gap-2 text-sm font-medium"><FileImage className="h-4 w-4 text-muted-foreground" /> Photos & proof <span className="text-xs font-normal text-muted-foreground">({photos.length})</span></div>{photos.length ? <div className="mt-2 flex flex-wrap gap-2">{photos.map((photo) => <a key={photo.id} href={`/pickup-proof/view-image?proofId=${encodeURIComponent(photo.id)}`} target="_blank" rel="noreferrer" className="rounded-lg border px-2.5 py-1.5 text-xs text-primary hover:bg-muted" aria-label={`Open ${photo.type ? `${label(photo.type)} proof` : "request photo"} in a new tab`}>View {photo.type ? `${label(photo.type)} proof` : "request photo"}</a>)}</div> : <p className="mt-2 text-xs text-muted-foreground">No request or delivery photos attached.</p>}</div>; }
