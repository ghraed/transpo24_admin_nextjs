import { createAdminProvider } from "@/lib/api/provider";

export const adminDriverEarningsProvider = createAdminProvider("/admin/driver-earnings", ["get", "post"], false);
