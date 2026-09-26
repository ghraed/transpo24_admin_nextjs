"use client";
import {
  WEB_PUSH_EVENT_NAME,
  useWebPushNotifications,
} from "@/components/web-push/web-push-provider";
import { showTestNotification } from "@/lib/web-push";
import { useCustom, useCustomMutation } from "@refinedev/core";
import React from "react";
import { toast } from "sonner";
import type { DriverReview, DriverReviewVehicle } from "./types";

export function useDriverReviews() {
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
  const onboardingInProgress = filteredReviews.filter(
    (review) =>
      review.status === "PENDING_PROFILE" ||
      review.status === "PENDING_DOCUMENTS",
  );
  const pendingReviews = filteredReviews.filter((review) => review.status === "PENDING_REVIEW");
  const reviewedHistory = filteredReviews.filter(
    (review) =>
      review.status !== "PENDING_REVIEW" &&
      review.status !== "PENDING_PROFILE" &&
      review.status !== "PENDING_DOCUMENTS",
  );
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
  return {
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
  };
}
