"use client";

import { useCustom, useCustomMutation } from "@refinedev/core";
import { Loader2, MessageSquareWarning } from "lucide-react";
import React from "react";

import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import type { ChatReportItem, ChatReportsResponse, ChatReportStatus } from "./types";

const PAGE_SIZE = 20;
const STATUSES: ChatReportStatus[] = ["PENDING", "REVIEWED", "ACTIONED", "DISMISSED"];

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString(undefined, { hourCycle: "h23" }) : "-";
}

function ReportCard({ item, onUpdated }: { item: ChatReportItem; onUpdated: () => void }) {
  const { mutateAsync } = useCustomMutation();
  const [status, setStatus] = React.useState<ChatReportStatus>(item.status);
  const [note, setNote] = React.useState(item.resolutionNote ?? "");
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  async function save(): Promise<void> {
    setIsSaving(true);
    setError("");
    try {
      await mutateAsync({
        url: `/admin/chat-reports/${encodeURIComponent(item.id)}`,
        method: "put",
        dataProviderName: "adminChatReports",
        values: { status, resolutionNote: note.trim() || undefined },
        errorNotification: false,
      });
      onUpdated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to update report.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="rounded-3xl border-border bg-card">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{item.reason.replaceAll("_", " ")}</CardTitle>
            <CardDescription className="mt-1">
              Request {item.transportRequestId} · reported {formatDate(item.createdAt)}
            </CardDescription>
          </div>
          <Badge variant={item.status === "PENDING" ? "destructive" : "secondary"}>
            {item.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-2xl bg-muted/45 p-4 text-sm md:grid-cols-2">
          <div><strong>Reporter:</strong> {item.reporter.name}<br /><span className="text-muted-foreground">{item.reporter.email} · {item.reporter.phoneNumber ?? "no phone"}</span></div>
          <div><strong>Reported user:</strong> {item.reportedUser.name}<br /><span className="text-muted-foreground">{item.reportedUser.email} · {item.reportedUser.phoneNumber ?? "no phone"}</span></div>
        </div>
        {item.message ? (
          <blockquote className="rounded-2xl border-l-4 border-destructive bg-destructive/5 p-4 text-sm">
            <div className="mb-2 text-xs font-semibold text-muted-foreground">Reported {item.message.senderRole.toLowerCase()} message · {formatDate(item.message.createdAt)}</div>
            {item.message.body ?? "Message has no text body."}
          </blockquote>
        ) : null}
        {item.details ? <p className="text-sm"><strong>Reporter details:</strong> {item.details}</p> : null}
        <div className="grid gap-3 md:grid-cols-[220px_1fr_auto] md:items-end">
          <label className="space-y-1 text-sm font-semibold">
            Moderation status
            <select className="h-10 w-full rounded-xl border bg-background px-3 font-normal" value={status} onChange={(event) => setStatus(event.target.value as ChatReportStatus)}>
              {STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-semibold">
            Resolution note
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="Record the review or enforcement action" />
          </label>
          <Button onClick={() => void save()} disabled={isSaving}>
            {isSaving ? <Loader2 className="animate-spin" /> : null} Save review
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  );
}

export default function ChatReportsPage() {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<ChatReportStatus | "ALL">("PENDING");
  const statusQuery = status === "ALL" ? "" : `&status=${status}`;
  const { query, result } = useCustom<ChatReportsResponse>({
    url: `/admin/chat-reports?page=${page}&limit=${PAGE_SIZE}${statusQuery}`,
    method: "get",
    dataProviderName: "adminChatReports",
  });
  const response = result.data;
  const totalPages = Math.max(1, Math.ceil((response?.total ?? 0) / PAGE_SIZE));

  return (
    <ListView className="gap-6">
      <ListViewHeader title="Chat Safety Reports" canCreate={false} />
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><MessageSquareWarning className="h-5 w-5" /> Moderation queue</CardTitle>
              <CardDescription className="mt-2">Review reports, preserve an audit note, and record action taken.</CardDescription>
            </div>
            <Badge variant="destructive">{response?.pendingCount ?? 0} pending</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <label className="text-sm font-semibold">Show status {" "}
            <select className="h-10 rounded-xl border bg-background px-3 font-normal" value={status} onChange={(event) => { setStatus(event.target.value as ChatReportStatus | "ALL"); setPage(1); }}>
              <option value="ALL">All</option>
              {STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
        </CardContent>
      </Card>
      {query.isLoading ? <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading reports…</div> : null}
      {query.isError ? <div className="rounded-2xl border border-destructive/30 p-4 text-sm text-destructive">{query.error instanceof Error ? query.error.message : "Failed to load reports."}</div> : null}
      {!query.isLoading && !query.isError && (response?.items.length ?? 0) === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No reports match this filter.</div> : null}
      {response?.items.map((item) => <ReportCard item={item} key={item.id} onUpdated={() => void query.refetch()} />)}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2"><Button variant="outline" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</Button><Button variant="outline" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page >= totalPages}>Next</Button></div>
      </div>
    </ListView>
  );
}
