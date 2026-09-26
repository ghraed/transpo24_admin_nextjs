import { createAdminProvider } from "@/lib/api/provider";

export const adminChatReportsProvider = createAdminProvider("/admin/chat-reports", ["get", "put"], false);
