import { createAdminProvider } from "@/lib/api/provider";

export const adminPaymentDisputesProvider = createAdminProvider("/admin/payments/disputes", ["get"], false);
