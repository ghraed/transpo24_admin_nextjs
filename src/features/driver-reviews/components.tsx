"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CarFront,
  CheckCircle2,
  ChevronDown,
  FileText,
  MapPin,
  XCircle
} from "lucide-react";
import React from "react";
import { formatDate, formatStatus, statusBadgeVariant, toAbsoluteDocumentUrl } from "./helpers";
import type { DriverReview, DriverReviewDocument, DriverReviewVehicle } from "./types";
export function DriverReviewCard({
  review,
  isMutating,
  onApproveVehicle,
  onDecline,
}: {
  review: DriverReview;
  isMutating: boolean;
  onApproveVehicle?: (vehicle: DriverReviewVehicle) => void;
  onDecline?: () => void;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const vehicleStatusCounts = review.vehicles.reduce<Record<string, number>>(
    (counts, vehicle) => ({
      ...counts,
      [vehicle.status]: (counts[vehicle.status] ?? 0) + 1,
    }),
    {},
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 px-5 pb-4 pt-5 md:px-6 md:pb-4 md:pt-6">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xl font-semibold tracking-[-0.03em]">{review.name}</h4>
              <Badge className="rounded-full" variant={statusBadgeVariant(review.status)}>{formatStatus(review.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {review.email} · {review.phone}
            </p>
            <p className="text-sm text-muted-foreground">
              {review.submittedForReviewAt
                ? `Submitted: ${formatDate(review.submittedForReviewAt)}`
                : "Application not submitted yet"}
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> {review.city || "Location unavailable"} <span>· Coverage: {review.coverageAreas.length > 0 ? review.coverageAreas.join(", ") : "-"}</span></p>
            <div className="flex flex-wrap gap-2 pt-1">
              {Object.entries(vehicleStatusCounts).map(([status, count]) => (
                <Badge key={status} className="rounded-full" variant={statusBadgeVariant(status as DriverReviewVehicle["status"])}>{count} vehicle{count === 1 ? "" : "s"} {formatStatus(status)}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-5 pb-5 lg:px-6 lg:pb-0 lg:pt-6">
            <CollapsibleTrigger asChild>
              <Button className="rounded-full px-5" variant="outline">
                {isOpen ? "Hide review" : "Open review"}
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            {review.status === "PENDING_REVIEW" && onDecline ? (
              <Button className="rounded-full px-5" variant="destructive" disabled={isMutating} onClick={onDecline}>
                <XCircle className="h-4 w-4" />
                Decline driver
              </Button>
            ) : null}
          </div>
        </div>

        <CollapsibleContent>
          <div className="m-5 space-y-5 border-t border-border/70 pt-5 md:m-6 md:pt-6">
            <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/[0.18] p-4">
              <div className="flex items-center justify-between">
                <h5 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-primary" />Onboarding documents</h5>
                <Badge className="rounded-full" variant="outline">{review.onboardingDocuments.length}</Badge>
              </div>
              <div className="space-y-2">
                {review.onboardingDocuments.length ? review.onboardingDocuments.map((document) => (
                  <DocumentRow key={document.id} document={document} />
                )) : <EmptyReviewArea label="No onboarding documents attached." />}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="flex items-center gap-2 font-semibold"><CarFront className="h-4 w-4 text-primary" />Vehicle submissions</h5>
                  <p className="mt-1 text-sm text-muted-foreground">The vehicle submitted for this driver review is marked below.</p>
                </div>
                <Badge className="rounded-full" variant="secondary">{review.vehicles.length} vehicles</Badge>
              </div>

              {review.vehicles.length ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {review.vehicles.map((vehicle) => (
                    <VehicleReviewCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      isMutating={isMutating}
                      isSubmittedVehicle={review.reviewVehicleId === vehicle.id}
                      onApprove={review.status === "PENDING_REVIEW" && review.reviewVehicleId && review.reviewVehicleId !== vehicle.id
                        ? undefined
                        : onApproveVehicle}
                    />
                  ))}
                </div>
              ) : (
                <EmptyReviewArea label="No vehicle submission is attached to this review yet." />
              )}
            </section>
          </div>
        </CollapsibleContent>
      </article>
    </Collapsible>
  );
}

export function VehicleReviewCard({ vehicle, isMutating, isSubmittedVehicle = false, onApprove }: { vehicle: DriverReviewVehicle; isMutating: boolean; isSubmittedVehicle?: boolean; onApprove?: (vehicle: DriverReviewVehicle) => void }) {
  const canApprove = vehicle.status === "PENDING_REVIEW" && vehicle.hasRequiredDocuments && vehicle.hasLoadCapacityProfile;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.22)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2"><h6 className="font-semibold">{vehicle.brand} {vehicle.model} {vehicle.year}</h6><Badge className="rounded-full" variant={statusBadgeVariant(vehicle.status)}>{formatStatus(vehicle.status)}</Badge>{isSubmittedVehicle ? <Badge className="rounded-full" variant="outline">Submitted for this review</Badge> : null}</div>
          <p className="text-sm text-muted-foreground">{formatStatus(vehicle.vehicleType)} <span className="px-1">·</span> Plate {vehicle.licensePlateNumber}</p>
          <div className="flex flex-wrap gap-2"><Badge variant={vehicle.hasRequiredDocuments ? "default" : "secondary"}>{vehicle.hasRequiredDocuments ? "Documents complete" : "Documents incomplete"}</Badge><Badge variant={vehicle.hasLoadCapacityProfile ? "default" : "secondary"}>{vehicle.hasLoadCapacityProfile ? "Capacity complete" : "Capacity incomplete"}</Badge></div>
        </div>
        {onApprove && vehicle.status === "PENDING_REVIEW" ? <Button className="rounded-full px-5" disabled={!canApprove || isMutating} onClick={() => onApprove(vehicle)}><CheckCircle2 className="h-4 w-4" />Approve vehicle</Button> : null}
      </div>
      {!canApprove && vehicle.status === "PENDING_REVIEW" ? <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Complete the required documents and load-capacity details before approving this vehicle.</p> : null}
      {vehicle.rejectionReason ? <p className="mt-4 text-sm text-destructive">{vehicle.rejectionReason}</p> : null}
      <div className="mt-4 space-y-2 border-t border-border/70 pt-4">{vehicle.documents.map((document) => <DocumentRow key={document.id} document={document} />)}</div>
    </div>
  );
}

export function DocumentRow({ document }: { document: DriverReviewDocument }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{document.type}</span>
        <Badge className="rounded-full" variant={statusBadgeVariant(document.status)}>{formatStatus(document.status)}</Badge>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span>Uploaded: {formatDate(document.uploadedAt)}</span>
        <a
          className="font-medium text-primary underline-offset-4 hover:underline"
          href={toAbsoluteDocumentUrl(document.url)}
          rel="noreferrer"
          target="_blank"
        >
          Open file
        </a>
      </div>
      {document.rejectionReason ? (
        <p className="mt-2 text-sm text-destructive">{document.rejectionReason}</p>
      ) : null}
    </div>
  );
}

export function EmptyReviewArea({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border/80 bg-background/60 px-4 py-5 text-sm text-muted-foreground">{label}</div>;
}

export function ReviewMetric({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  );
}
