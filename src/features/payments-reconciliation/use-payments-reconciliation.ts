"use client";
import { useCustom, useCustomMutation } from "@refinedev/core";
import React from "react";
import { toast } from "sonner";
import { PAGE_SIZE } from "./helpers";
import type {
  PaymentsReconciliationResponse,
  ReconciliationStatus,
  ReconciliationStream,
  RunPaymentsReconciliationResponse
} from "./types";

export function usePaymentsReconciliation() {
  const [stream, setStream] = React.useState<ReconciliationStream>("all");
  const [status, setStatus] = React.useState<ReconciliationStatus>("all");
  const [page, setPage] = React.useState(1);
  const [isRunning, setIsRunning] = React.useState(false);
  const { query, result } = useCustom<PaymentsReconciliationResponse>({
    url: `/admin/payments/reconciliation?page=${page}&limit=${PAGE_SIZE}&stream=${stream}&status=${status}`,
    method: "get",
    dataProviderName: "adminPaymentsReconciliation",
  });
  const { mutate } = useCustomMutation();
  const response = result.data;
  const items = response?.items ?? [];
  const latestRuns = response?.latestRuns ?? [];
  const summary = response?.summary;
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);
  const handleRun = () => {
    setIsRunning(true);

    mutate(
      {
        url: "/admin/payments/reconciliation/run",
        method: "post",
        values: { stream: "all" },
        dataProviderName: "adminPaymentsReconciliation",
      },
      {
        onSuccess: (response) => {
          const runs =
            (response?.data as RunPaymentsReconciliationResponse | undefined)?.runs ??
            [];
          toast.success(
            runs.length > 0
              ? `Completed ${runs.length} reconciliation job${runs.length === 1 ? "" : "s"}.`
              : "Payments reconciliation completed.",
          );
          void query.refetch();
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to run payments reconciliation.",
          );
        },
        onSettled: () => {
          setIsRunning(false);
        },
      },
    );
  };
  return { stream, setStream, status, setStatus, page, setPage, isRunning, query, items, latestRuns, summary, total, totalPages, handleRun };
}
