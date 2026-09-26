import { createAdminProvider } from "@/lib/api/provider";

export const adminDeliveryOperationsProvider = createAdminProvider("/admin/delivery-operations", ["get"], false);
