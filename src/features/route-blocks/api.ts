import { createAdminProvider } from "@/lib/api/provider";

export const adminRouteBlocksProvider = createAdminProvider("/admin/route-blocks", ["get", "post", "patch", "delete"], false);
