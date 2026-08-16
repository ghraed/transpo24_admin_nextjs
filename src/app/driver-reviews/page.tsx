"use client";

import React from "react";
import { useCustom, useCustomMutation } from "@refinedev/core";
import {
  BellRing,
  CarFront,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  WEB_PUSH_EVENT_NAME,
  useWebPushNotifications,
} from "@/components/web-push/web-push-provider";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showTestNotification } from "@/lib/web-push";

type ReviewStatus =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "PENDING_DOCUMENTS"
  | "PENDING_PROFILE";

type DocumentStatus =
  | "UPLOADED"
  | "UNDER_REVIEW"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED";

type DriverReviewDocument = {
  id: string;
  type: string;
  url: string;
  status: DocumentStatus;
  rejectionReason: string | null;
  uploadedAt: string;
};

type DriverReviewVehicle = {
  id: string;
  vehicleType: string;
  brand: string;
  model: string;
  year: number;
  licensePlateNumber: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "INACTIVE";
  rejectionReason: string | null;
  isActive: boolean;
  hasRequiredDocuments: boolean;
  hasLoadCapacityProfile: boolean;
  documents: DriverReviewDocument[];
};

type DriverReview = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  coverageAreas: string[];
  identityDocumentKind: string | null;
  status: ReviewStatus;
  submittedForReviewAt: string | null;
  onboardingDocuments: DriverReviewDocument[];
  vehicles: DriverReviewVehicle[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function toAbsoluteDocumentUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
}

function statusBadgeVariant(status: ReviewStatus | DocumentStatus | DriverReviewVehicle["status"]) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, { hourCycle: "h23" });
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function DriverReviewsPage() {
  const webPush = useWebPushNotifications();
  const { query, result } = useCustom<{ items: DriverReview[] }>({
    url: "/admin/driver-reviews",
    method: "get",
    dataProviderName: "adminDriverReviews",
  });
  const { mutate, mutation } = useCustomMutation();
  const [activeReview, setActiveReview] = React.useState<DriverReview | null>(null);
  const [approveVehicle, setApproveVehicle] = React.useState<{
    review: DriverReview;
    vehicle: DriverReviewVehicle;
  } | null>(null);
  const [declineReason, setDeclineReason] = React.useState("");
  const [reviews, setReviews] = React.useState<DriverReview[]>([]);
  const [isTestingNotification, setIsTestingNotification] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [driverStatusFilter, setDriverStatusFilter] = React.useState("all");
  const [vehicleStatusFilter, setVehicleStatusFilter] = React.useState("all");

  React.useEffect(() => {
    if (result.data?.items) {
      setReviews(result.data.items);
    }
  }, [result.data?.items]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const onWebPushReceived = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string | null }>).detail;
      if (detail?.type !== "DRIVER_REVIEW_SUBMITTED") {
        return;
      }

      void query.refetch();
    };

    window.addEventListener(WEB_PUSH_EVENT_NAME, onWebPushReceived);

    return () => {
      window.removeEventListener(WEB_PUSH_EVENT_NAME, onWebPushReceived);
    };
  }, [query]);

  const filteredReviews = reviews.filter((review) => {
    const searchValue = search.trim().toLowerCase();
    const matchesSearch = !searchValue || review.name.toLowerCase().includes(searchValue) || review.phone.toLowerCase().includes(searchValue);
    const matchesDriverStatus = driverStatusFilter === "all" || review.status === driverStatusFilter;
    const matchesVehicleStatus = vehicleStatusFilter === "all" || review.vehicles.some((vehicle) => vehicle.status === vehicleStatusFilter);

    return matchesSearch && matchesDriverStatus && matchesVehicleStatus;
  });
  const pendingReviews = filteredReviews.filter((review) => review.status === "PENDING_REVIEW");
  const reviewedHistory = filteredReviews.filter((review) => review.status !== "PENDING_REVIEW");
  const approvedReviews = filteredReviews.filter((review) => review.status === "APPROVED");
  const declinedReviews = filteredReviews.filter((review) => review.status === "REJECTED");
  const pendingVehicles = filteredReviews.flatMap((review) => review.vehicles).filter((vehicle) => vehicle.status === "PENDING_REVIEW");
  const hasActiveFilters = Boolean(search) || driverStatusFilter !== "all" || vehicleStatusFilter !== "all";

  const handleApproveVehicle = () => {
    if (!approveVehicle) return;

    mutate(
      {
        url: `/admin/driver-reviews/${approveVehicle.review.id}/vehicles/${approveVehicle.vehicle.id}/approve`,
        method: "post",
        values: {},
        dataProviderName: "adminDriverReviews",
      },
      {
        onSuccess: (response) => {
          const updatedReview = response?.data as DriverReview | undefined;
          setReviews((current) =>
            current.map((review) =>
              review.id === approveVehicle.review.id
                ? updatedReview ?? {
                    ...review,
                    status: "APPROVED",
                    vehicles: review.vehicles.map((vehicle) =>
                      vehicle.id === approveVehicle.vehicle.id
                        ? { ...vehicle, status: "APPROVED", isActive: true, rejectionReason: null, documents: vehicle.documents.map((document) => ({ ...document, status: "APPROVED", rejectionReason: null })) }
                        : vehicle,
                    ),
                  }
                : review,
            ),
          );
          toast.success("Vehicle approved successfully.");
          setApproveVehicle(null);
          void query.refetch();
        },
      }
    );
  };

  const handleDecline = () => {
    if (!activeReview) return;

    mutate(
      {
        url: `/admin/driver-reviews/${activeReview.id}/decline`,
        method: "post",
        values: {
          reason: declineReason.trim() || undefined,
        },
        dataProviderName: "adminDriverReviews",
      },
      {
        onSuccess: (response) => {
          const updatedReview = response?.data as DriverReview | undefined;
          const normalizedReason = declineReason.trim() || "Declined by admin review.";
          setReviews((current) =>
            current.map((review) =>
              review.id === activeReview.id
                ? updatedReview ?? {
                    ...review,
                    status: "REJECTED",
                    vehicles: review.vehicles.map((vehicle) => ({
                      ...vehicle,
                      status: "REJECTED",
                      isActive: false,
                      rejectionReason: normalizedReason,
                      documents: vehicle.documents.map((document) => ({
                        ...document,
                        status: "REJECTED",
                        rejectionReason: normalizedReason,
                      })),
                    })),
                    onboardingDocuments: review.onboardingDocuments.map((document) => ({
                      ...document,
                      status: "REJECTED",
                      rejectionReason: normalizedReason,
                    })),
                  }
                : review,
            ),
          );
          setActiveReview(null);
          setDeclineReason("");
          toast.success("Driver declined successfully.");
          void query.refetch();
        },
      }
    );
  };

  const handleTestNotification = async () => {
    if (webPush.status !== "subscribed") {
      toast.error("Enable browser notifications from the dashboard before testing.");
      return;
    }

    setIsTestingNotification(true);

    try {
      await showTestNotification();
      toast.success("Test browser notification sent to this device.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send the test browser notification.",
      );
    } finally {
      setIsTestingNotification(false);
    }
  };

  const isMutating = mutation.isPending;

  return (
    <ListView className="gap-6">
      <ListViewHeader canCreate={false} title="Driver Requests" />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ReviewMetric label="Awaiting review" value={pendingReviews.length} icon={Clock3} accent="bg-amber-100 text-amber-800" />
        <ReviewMetric label="Vehicles pending review" value={pendingVehicles.length} icon={CarFront} accent="bg-amber-100 text-amber-800" />
        <ReviewMetric label="Total submissions" value={filteredReviews.length} icon={FileText} accent="bg-primary/10 text-primary" />
        <ReviewMetric label="Approved" value={approvedReviews.length} icon={CheckCircle2} accent="bg-emerald-100 text-emerald-700" />
        <ReviewMetric label="Declined" value={declinedReviews.length} icon={XCircle} accent="bg-rose-100 text-rose-700" />
      </section>

      <section className="rounded-3xl border border-border bg-card p-4 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)] md:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-sm font-medium" htmlFor="driver-review-search">Find a driver</label>
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input id="driver-review-search" className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by driver name or phone number" /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:w-[440px]">
            <div className="space-y-2"><label className="text-sm font-medium">Driver status</label><Select value={driverStatusFilter} onValueChange={setDriverStatusFilter}><SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All driver statuses</SelectItem><SelectItem value="PENDING_REVIEW">Pending review</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem><SelectItem value="PENDING_DOCUMENTS">Pending documents</SelectItem><SelectItem value="PENDING_PROFILE">Pending profile</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><label className="text-sm font-medium">Vehicle status</label><Select value={vehicleStatusFilter} onValueChange={setVehicleStatusFilter}><SelectTrigger><SelectValue placeholder="All vehicles" /></SelectTrigger><SelectContent><SelectItem value="all">All vehicle statuses</SelectItem><SelectItem value="PENDING_REVIEW">Pending review</SelectItem><SelectItem value="APPROVED">Approved</SelectItem><SelectItem value="REJECTED">Rejected</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent></Select></div>
          </div>
          {hasActiveFilters ? <Button type="button" variant="ghost" className="rounded-full" onClick={() => { setSearch(""); setDriverStatusFilter("all"); setVehicleStatusFilter("all"); }}>Clear filters</Button> : <div className="flex items-center gap-2 text-sm text-muted-foreground"><SlidersHorizontal className="h-4 w-4" />{filteredReviews.length} drivers</div>}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-border bg-card px-5 py-4 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)] md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BellRing className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold tracking-[-0.02em]">Review alerts</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Test browser notifications after enabling them from the dashboard.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-5"
          disabled={isTestingNotification || webPush.status !== "subscribed"}
          onClick={() => {
            void handleTestNotification();
          }}
        >
          {isTestingNotification ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
          {isTestingNotification ? "Sending test..." : "Test notification"}
        </Button>
      </section>

      {query.isLoading ? (
        <div className="flex items-center gap-3 rounded-lg border p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading driver review requests...
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {query.error instanceof Error
            ? query.error.message
            : "Failed to load driver review requests."}
        </div>
      ) : null}

      {!query.isLoading && !query.isError && reviews.length === 0 ? (
        <div className="rounded-lg border p-6 text-sm text-muted-foreground">
          No driver review requests have been submitted yet.
        </div>
      ) : null}

      {!query.isLoading && !query.isError && reviews.length > 0 && filteredReviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
          No drivers match the current search and filters.
        </div>
      ) : null}

      {pendingReviews.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.03em]">Awaiting review</h3>
              <p className="mt-1 text-sm text-muted-foreground">Verify documents and vehicle details before approving access.</p>
            </div>
            <Badge className="rounded-full px-3 py-1" variant="secondary">{pendingReviews.length} pending</Badge>
          </div>
          <div className="grid gap-4">
            {pendingReviews.map((review) => (
              <DriverReviewCard
                key={review.id}
                review={review}
                isMutating={isMutating}
                onApproveVehicle={(vehicle) => setApproveVehicle({ review, vehicle })}
                onDecline={() => {
                  setActiveReview(review);
                  setDeclineReason("");
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {reviewedHistory.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.03em]">Review history</h3>
              <p className="mt-1 text-sm text-muted-foreground">Previously processed driver submissions.</p>
            </div>
            <Badge className="rounded-full px-3 py-1" variant="secondary">{reviewedHistory.length} reviewed</Badge>
          </div>
          <div className="grid gap-4">
            {reviewedHistory.map((review) => (
              <DriverReviewCard
                key={review.id}
                review={review}
                isMutating={isMutating}
                onApproveVehicle={(vehicle) => setApproveVehicle({ review, vehicle })}
              />
            ))}
          </div>
        </section>
        ) : null}

      <AlertDialog
        open={Boolean(approveVehicle)}
        onOpenChange={(open) => {
          if (!open) {
            setApproveVehicle(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              {approveVehicle
                ? `Approve the ${approveVehicle.vehicle.brand} ${approveVehicle.vehicle.model} for ${approveVehicle.review.name}? Only this vehicle and its documents will be approved.`
                : "Approve this vehicle submission?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isMutating} onClick={handleApproveVehicle}>
              {isMutating ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={Boolean(activeReview)}
        onOpenChange={(open) => {
          if (!open) {
            setActiveReview(null);
            setDeclineReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Driver Review</DialogTitle>
            <DialogDescription>
              This will mark the driver review request as declined. You can include an optional
              internal reason.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Optional decline reason"
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActiveReview(null);
                setDeclineReason("");
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={isMutating} onClick={handleDecline}>
              {isMutating ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListView>
  );
}

function DriverReviewCard({
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
            Submitted: {formatDate(review.submittedForReviewAt)}
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
              <p className="mt-1 text-sm text-muted-foreground">Review and approve each vehicle independently.</p>
            </div>
            <Badge className="rounded-full" variant="secondary">{review.vehicles.length} vehicles</Badge>
          </div>

          {review.vehicles.length ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {review.vehicles.map((vehicle) => (
                <VehicleReviewCard key={vehicle.id} vehicle={vehicle} isMutating={isMutating} onApprove={onApproveVehicle} />
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

function VehicleReviewCard({ vehicle, isMutating, onApprove }: { vehicle: DriverReviewVehicle; isMutating: boolean; onApprove?: (vehicle: DriverReviewVehicle) => void }) {
  const canApprove = vehicle.status === "PENDING_REVIEW" && vehicle.hasRequiredDocuments && vehicle.hasLoadCapacityProfile;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.22)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2"><h6 className="font-semibold">{vehicle.brand} {vehicle.model} {vehicle.year}</h6><Badge className="rounded-full" variant={statusBadgeVariant(vehicle.status)}>{formatStatus(vehicle.status)}</Badge></div>
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

function DocumentRow({ document }: { document: DriverReviewDocument }) {
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

function EmptyReviewArea({ label }: { label: string }) {
  return <div className="rounded-xl border border-dashed border-border/80 bg-background/60 px-4 py-5 text-sm text-muted-foreground">{label}</div>;
}

function ReviewMetric({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-medium text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{value}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}><Icon className="h-4 w-4" /></div>
      </div>
    </div>
  );
}
