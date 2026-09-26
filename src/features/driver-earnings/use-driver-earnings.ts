"use client";
import { useCustom, useCustomMutation } from "@refinedev/core";
import React from "react";
import { toast } from "sonner";
import { PAGE_SIZE, newestRecordTimestamp } from "./helpers";
import type {
  DriverEarningAdminItem,
  DriverEarningsResponse,
  DriverEarningsView,
} from "./types";

export function useDriverEarnings() {
  const [view, setView] = React.useState<DriverEarningsView>("all");
  const [page, setPage] = React.useState(1);
  const [retryingTripId, setRetryingTripId] = React.useState<string | null>(null);
  const { query, result } = useCustom<DriverEarningsResponse>({
    url: `/admin/driver-earnings?page=${page}&limit=${PAGE_SIZE}&view=${view}`,
    method: "get",
    dataProviderName: "adminDriverEarnings",
    queryOptions: {
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  });
  const { mutate } = useCustomMutation();
  const response = result.data;
  const items = [...(response?.items ?? [])].sort(
    (left, right) => newestRecordTimestamp(right) - newestRecordTimestamp(left),
  );
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
  return { view, setView, page, setPage, retryingTripId, query, items, summary, total, totalPages, handleRetry };
}
