"use client";
import type { DataProviders } from "@refinedev/core";
import { simpleRestProvider } from "@/lib/api/provider";
import { adminUsersProvider } from "@/features/admin-users/api";
import { adminRouteBlocksProvider } from "@/features/route-blocks/api";
import { adminDriverReviewsProvider } from "@/features/driver-reviews/api";
import { adminDriverEarningsProvider } from "@/features/driver-earnings/api";
import { adminDeliveryOperationsProvider } from "@/features/delivery-operations/api";
import { adminPaymentDisputesProvider } from "@/features/payment-disputes/api";
import { adminChatReportsProvider } from "@/features/chat-reports/api";
import { adminPaymentsReconciliationProvider } from "@/features/payments-reconciliation/api";

export const dataProvider: DataProviders = {
  default: simpleRestProvider,
  adminUsers: adminUsersProvider,
  adminRouteBlocks: adminRouteBlocksProvider,
  adminDriverReviews: adminDriverReviewsProvider,
  adminDriverEarnings: adminDriverEarningsProvider,
  adminDeliveryOperations: adminDeliveryOperationsProvider,
  adminPaymentDisputes: adminPaymentDisputesProvider,
  adminChatReports: adminChatReportsProvider,
  adminPaymentsReconciliation: adminPaymentsReconciliationProvider,
};
