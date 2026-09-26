import { createAdminProvider } from "@/lib/api/provider";

export const adminPaymentsReconciliationProvider = createAdminProvider("/admin/payments/reconciliation", ["get", "post"], false);
