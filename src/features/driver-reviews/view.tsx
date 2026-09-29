"use client";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BellRing,
  CarFront,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Search,
  SlidersHorizontal,
  XCircle
} from "lucide-react";
import { DriverReviewCard, ReviewMetric } from "./components";
import { useDriverReviews } from "./use-driver-reviews";

export default function DriverReviewsPage() {
  const {
    webPush,
    query,
    activeReview,
    setActiveReview,
    approveVehicle,
    setApproveVehicle,
    declineReason,
    setDeclineReason,
    reviews,
    isTestingNotification,
    search,
    setSearch,
    driverStatusFilter,
    setDriverStatusFilter,
    vehicleStatusFilter,
    setVehicleStatusFilter,
    filteredReviews,
    onboardingInProgress,
    pendingReviews,
    reviewedHistory,
    approvedReviews,
    declinedReviews,
    pendingVehicles,
    hasActiveFilters,
    handleApproveVehicle,
    handleDecline,
    handleTestNotification,
    isMutating,
  } = useDriverReviews();
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

      {onboardingInProgress.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-xl font-semibold tracking-[-0.03em]">Onboarding in progress</h3>
              <p className="mt-1 text-sm text-muted-foreground">New drivers who have not yet submitted a complete application for review.</p>
            </div>
            <Badge className="rounded-full px-3 py-1" variant="secondary">{onboardingInProgress.length} in progress</Badge>
          </div>
          <div className="grid gap-4">
            {onboardingInProgress.map((review) => (
              <DriverReviewCard key={review.id} review={review} isMutating={isMutating} />
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
              Explain what the driver needs to correct. This reason will be shown to the driver.
            </DialogDescription>
          </DialogHeader>

          <label className="text-sm font-medium" htmlFor="driver-decline-reason">Reason for driver</label>
          <Textarea
            id="driver-decline-reason"
            placeholder="Explain what the driver needs to correct"
            value={declineReason}
            onChange={(event) => setDeclineReason(event.target.value)}
            maxLength={500}
            required
            aria-required="true"
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
            <Button variant="destructive" disabled={isMutating || !declineReason.trim()} onClick={handleDecline}>
              {isMutating ? "Declining..." : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListView>
  );
}
