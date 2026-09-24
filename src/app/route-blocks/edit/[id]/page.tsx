"use client";

import { useParams } from "next/navigation";
import { useCustom } from "@refinedev/core";
import { BlockForm } from "../../block-form";
import { Button } from "@/components/ui/button";
import type { RouteBlock } from "@/lib/route-blocks";

export default function EditRouteBlockPage() {
  const { id } = useParams<{ id: string }>();
  const { query, result } = useCustom<RouteBlock>({
    url: `/admin/route-blocks/${encodeURIComponent(id)}`, method: "get", dataProviderName: "adminRouteBlocks",
  });
  if (query.isLoading) return <p role="status">Loading route block…</p>;
  if (query.error) return <div role="alert"><p>{query.error.message}</p><Button onClick={() => void query.refetch()}>Retry</Button></div>;
  return result.data ? <BlockForm key={result.data.id} block={result.data} /> : <p>Route block not found.</p>;
}
