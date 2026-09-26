export type ChatReportStatus = "PENDING" | "REVIEWED" | "ACTIONED" | "DISMISSED";

export interface ChatReportParty {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  role: string;
}

export interface ChatReportItem {
  id: string;
  reason: string;
  details: string | null;
  status: ChatReportStatus;
  resolutionNote: string | null;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  transportRequestId: string;
  roomId: string;
  reporter: ChatReportParty;
  reportedUser: ChatReportParty;
  message: {
    id: string;
    senderRole: string;
    body: string | null;
    createdAt: string;
  } | null;
}

export interface ChatReportsResponse {
  items: ChatReportItem[];
  total: number;
  pendingCount: number;
  page: number;
  limit: number;
}
