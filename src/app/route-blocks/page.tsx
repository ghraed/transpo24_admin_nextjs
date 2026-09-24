"use client";

import { useState } from "react";
import Link from "next/link";
import { useCustom, useCustomMutation } from "@refinedev/core";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlockConfirmation, CountryField, SelectField } from "./controls";
import { directionLabel, typeLabel, routeBlockError, TRANSPORT_TYPES, ROLLOUT_WARNING, LIFECYCLE_WARNING, type RouteBlock, type RouteBlockList } from "@/lib/route-blocks";

const PAGE_SIZE = 20;
const emptyFilters = { fromCountryCode: "", toCountryCode: "", transportType: "", isActive: "" };

export default function RouteBlocksPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState<RouteBlock | null>(null);
  const [error, setError] = useState("");
  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
  const { query, result } = useCustom<RouteBlockList>({
    url: `/admin/route-blocks?${params}`, method: "get", dataProviderName: "adminRouteBlocks",
  });
  const { mutate, mutation } = useCustomMutation();
  const response = result.data;
  const pages = Math.max(1, Math.ceil((response?.total ?? 0) / PAGE_SIZE));
  function filter(key: keyof typeof filters, value: string) {
    setFilters(current => ({ ...current, [key]: value }));
    setPage(1);
  }
  function saveStatus() {
    if (!pending || mutation.isPending) return;
    setError("");
    mutate({ url: `/admin/route-blocks/${encodeURIComponent(pending.id)}`, method: "patch",
      values: { isActive: pending.isActive }, dataProviderName: "adminRouteBlocks", errorNotification: false,
    }, { onSuccess: () => { setPending(null); void query.refetch(); }, onError: err => setError(routeBlockError(err)) });
  }
  return <ListView className="gap-6">
    <ListViewHeader title="Route Blocks" />
    <div className="space-y-2 rounded-2xl border bg-card p-5 text-sm">
      <p>Routes are allowed by default. Only explicit blocks appear here. Country direction and transport type determine which requests are blocked.</p>
      <p>{LIFECYCLE_WARNING}</p>
      <p className="font-medium text-amber-700 dark:text-amber-400">{ROLLOUT_WARNING}</p>
    </div>
    <section aria-label="Route block filters" className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2 xl:grid-cols-4">
      <CountryField label="From country" filter value={filters.fromCountryCode} onChange={value => filter("fromCountryCode", value)} />
      <CountryField label="To country" filter value={filters.toCountryCode} onChange={value => filter("toCountryCode", value)} />
      <SelectField label="Transport type" value={filters.transportType} onChange={value => filter("transportType", value)}>
        <option value="">Any type (including all-type blocks)</option>
        {Object.entries(TRANSPORT_TYPES).map(([value, label]) => <option key={value} value={value}>{label} only</option>)}
      </SelectField>
      <SelectField label="Status" value={filters.isActive} onChange={value => filter("isActive", value)}>
        <option value="">Any status</option><option value="true">Active</option><option value="false">Inactive</option>
      </SelectField>
      <p className="text-xs text-muted-foreground md:col-span-2">Specific-type filters show rules for that type only. All-type blocks can also affect the route.</p>
      <Button variant="outline" onClick={() => { setFilters(emptyFilters); setPage(1); }}>Clear filters</Button>
    </section>
    {query.isLoading && <p role="status">Loading route blocks…</p>}
    {query.error && <div role="alert"><p>{query.error.message}</p><Button variant="outline" onClick={() => void query.refetch()}>Retry</Button></div>}
    {!query.isLoading && !query.error && response && <>
      {!response.items.length ? <p className="rounded-2xl border border-dashed p-10 text-center">No blocks match this view. Routes without an applicable active block are allowed.</p> :
        <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full text-left text-sm">
          <caption className="sr-only">Directional route blocks</caption>
          <thead><tr className="border-b">{["Direction / type", "Status", "Internal reason", "Created / updated", "Creator ID", "Actions"].map(label => <th scope="col" className="p-4" key={label}>{label}</th>)}</tr></thead>
          <tbody>{response.items.map(block => <tr key={block.id} className="border-b last:border-0">
            <td className="p-4"><p className="font-medium">{directionLabel(block)}</p><p>{typeLabel(block.transportType)}</p></td>
            <td className="p-4"><Badge variant={block.isActive ? "destructive" : "secondary"}>{block.isActive ? "Active" : "Inactive"}</Badge></td>
            <td className="max-w-xs whitespace-pre-wrap break-words p-4">{block.reason || "—"}</td>
            <td className="p-4"><p>Created: {new Date(block.createdAt).toLocaleString()}</p><p>Updated: {new Date(block.updatedAt).toLocaleString()}</p></td>
            <td className="max-w-40 break-all p-4">{block.createdByAdminId || "Not recorded"}</td>
            <td className="p-4"><div className="flex gap-2"><Button asChild size="sm" variant="outline"><Link href={`/route-blocks/edit/${encodeURIComponent(block.id)}`}>Edit</Link></Button>
              <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => { setError(""); setPending({ ...block, isActive: !block.isActive }); }}>{block.isActive ? "Deactivate" : "Activate"}</Button></div></td>
          </tr>)}</tbody>
        </table></div>}
      <nav aria-label="Route block pagination" className="flex flex-wrap items-center justify-between gap-3">
        <span>{response.total} blocks · Page {page} of {pages}</span>
        <div className="flex gap-2"><Button variant="outline" disabled={page === 1 || query.isFetching} onClick={() => setPage(value => value - 1)}>Previous</Button><Button variant="outline" disabled={page >= pages || query.isFetching} onClick={() => setPage(value => value + 1)}>Next</Button></div>
      </nav>
    </>}
    <BlockConfirmation value={pending} busy={mutation.isPending} error={error} onCancel={() => setPending(null)} onConfirm={saveStatus} />
  </ListView>;
}
