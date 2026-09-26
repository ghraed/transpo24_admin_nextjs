import { createAdminProvider } from "@/lib/api/provider";

export const adminDriverReviewsProvider = createAdminProvider("/admin/driver-reviews", ["get", "post"], true);
