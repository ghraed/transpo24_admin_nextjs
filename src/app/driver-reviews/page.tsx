"use client";

import React from "react";
import { useCustom, useCustomMutation } from "@refinedev/core";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  vehicle: DriverReviewVehicle | null;
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
  return new Date(value).toLocaleString();
}

export default function DriverReviewsPage() {
  const { query, result } = useCustom<{ items: DriverReview[] }>({
    url: "/admin/driver-reviews",
    method: "get",
    dataProviderName: "adminDriverReviews",
  });
  const { mutate, mutation } = useCustomMutation();
  const [activeReview, setActiveReview] = React.useState<DriverReview | null>(null);
  const [approveReview, setApproveReview] = React.useState<DriverReview | null>(null);
  const [declineReason, setDeclineReason] = React.useState("");
  const [reviews, setReviews] = React.useState<DriverReview[]>([]);

  React.useEffect(() => {
    if (result.data?.items) {
      setReviews(result.data.items);
    }
  }, [result.data?.items]);

  const pendingReviews = reviews.filter((review) => review.status === "PENDING_REVIEW");
  const reviewedHistory = reviews.filter((review) => review.status !== "PENDING_REVIEW");

  const handleApprove = () => {
    if (!approveReview) return;

    mutate(
      {
        url: `/admin/driver-reviews/${approveReview.id}/approve`,
        method: "post",
        values: {},
        dataProviderName: "adminDriverReviews",
      },
      {
        onSuccess: (response) => {
          const updatedReview = response?.data as DriverReview | undefined;
          setReviews((current) =>
            current.map((review) =>
              review.id === approveReview.id
                ? updatedReview ?? {
                    ...review,
                    status: "APPROVED",
                    vehicle: review.vehicle
                      ? {
                          ...review.vehicle,
                          status: "APPROVED",
                          isActive: true,
                          rejectionReason: null,
                        }
                      : null,
                  }
                : review,
            ),
          );
          toast.success("Driver approved successfully.");
          setApproveReview(null);
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
                    vehicle: review.vehicle
                      ? {
                          ...review.vehicle,
                          status: "REJECTED",
                          isActive: false,
                          rejectionReason: normalizedReason,
                        }
                      : null,
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

  const isMutating = mutation.isPending;

  return (
    <ListView className="gap-6">
      <ListViewHeader canCreate={false} title="Driver Requests" />

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

      {pendingReviews.length > 0 ? (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Pending Review</h3>
          <div className="grid gap-4">
            {pendingReviews.map((review) => (
              <DriverReviewCard
                key={review.id}
                review={review}
                isMutating={isMutating}
                onApprove={() => setApproveReview(review)}
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
          <h3 className="text-lg font-semibold">Reviewed</h3>
          <div className="grid gap-4">
            {reviewedHistory.map((review) => (
              <DriverReviewCard key={review.id} review={review} isMutating={false} />
            ))}
          </div>
        </section>
        ) : null}

      <AlertDialog
        open={Boolean(approveReview)}
        onOpenChange={(open) => {
          if (!open) {
            setApproveReview(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Driver Review</AlertDialogTitle>
            <AlertDialogDescription>
              {approveReview
                ? `Approve ${approveReview.name} and mark this driver review request as approved?`
                : "Approve this driver review request?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMutating}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={isMutating} onClick={handleApprove}>
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
  onApprove,
  onDecline,
}: {
  review: DriverReview;
  isMutating: boolean;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold">{review.name}</h4>
            <Badge variant={statusBadgeVariant(review.status)}>{review.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {review.email} · {review.phone}
          </p>
          <p className="text-sm text-muted-foreground">
            Submitted: {formatDate(review.submittedForReviewAt)}
          </p>
          <p className="text-sm text-muted-foreground">
            City: {review.city || "-"} · Coverage:{" "}
            {review.coverageAreas.length > 0 ? review.coverageAreas.join(", ") : "-"}
          </p>
        </div>

        {review.status === "PENDING_REVIEW" && onApprove && onDecline ? (
          <div className="flex gap-2">
            <Button disabled={isMutating} onClick={onApprove}>
              Approve
            </Button>
            <Button variant="destructive" disabled={isMutating} onClick={onDecline}>
              Decline
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Onboarding Documents</h5>
            <Badge variant="outline">{review.onboardingDocuments.length}</Badge>
          </div>
          <div className="space-y-2">
            {review.onboardingDocuments.map((document) => (
              <DocumentRow key={document.id} document={document} />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="font-medium">Vehicle Review</h5>
            {review.vehicle ? (
              <Badge variant={statusBadgeVariant(review.vehicle.status)}>{review.vehicle.status}</Badge>
            ) : (
              <Badge variant="secondary">No vehicle</Badge>
            )}
          </div>

          {review.vehicle ? (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">
                {review.vehicle.brand} {review.vehicle.model} {review.vehicle.year}
              </p>
              <p className="text-sm text-muted-foreground">
                {review.vehicle.vehicleType} · Plate {review.vehicle.licensePlateNumber}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant={review.vehicle.hasRequiredDocuments ? "default" : "secondary"}>
                  {review.vehicle.hasRequiredDocuments ? "Docs complete" : "Docs incomplete"}
                </Badge>
                <Badge variant={review.vehicle.hasLoadCapacityProfile ? "default" : "secondary"}>
                  {review.vehicle.hasLoadCapacityProfile
                    ? "Load capacity complete"
                    : "Load capacity incomplete"}
                </Badge>
              </div>
              {review.vehicle.rejectionReason ? (
                <p className="text-sm text-destructive">{review.vehicle.rejectionReason}</p>
              ) : null}
              <div className="space-y-2">
                {review.vehicle.documents.map((document) => (
                  <DocumentRow key={document.id} document={document} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No vehicle submission is attached to this review yet.
            </div>
          )}
        </section>
      </div>
    </article>
  );
}

function DocumentRow({ document }: { document: DriverReviewDocument }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{document.type}</span>
        <Badge variant={statusBadgeVariant(document.status)}>{document.status}</Badge>
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
