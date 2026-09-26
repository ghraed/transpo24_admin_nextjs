"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ROLLOUT_WARNING, routeBlockError, TRANSPORT_TYPES, type RouteBlock, type RouteBlockValues, type TransportType } from "@/lib/route-blocks";
import { useCustomMutation } from "@refinedev/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlockConfirmation, CountryField, SelectField } from "./controls";

export function BlockForm({ block }: { block?: RouteBlock }) {
  const router = useRouter();
  const [values, setValues] = useState<RouteBlockValues>({
    fromCountryCode: block?.fromCountryCode ?? "", toCountryCode: block?.toCountryCode ?? "",
    transportType: block?.transportType ?? null, reason: block?.reason ?? "", isActive: block?.isActive ?? true,
  });
  const [pending, setPending] = useState<RouteBlockValues | null>(null);
  const [error, setError] = useState("");
  const { mutate, mutation } = useCustomMutation();
  function change<K extends keyof RouteBlockValues>(key: K, value: RouteBlockValues[K]) {
    setValues(current => ({ ...current, [key]: value }));
  }
  function save() {
    if (!pending || mutation.isPending) return;
    setError("");
    mutate({
      url: block ? `/admin/route-blocks/${encodeURIComponent(block.id)}` : "/admin/route-blocks",
      method: block ? "patch" : "post", values: pending, dataProviderName: "adminRouteBlocks", errorNotification: false,
    }, { onSuccess: () => router.push("/route-blocks"), onError: err => setError(routeBlockError(err)) });
  }
  return <div className="mx-auto my-6 w-full max-w-3xl space-y-6 rounded-3xl border bg-card p-6">
    <h1 className="text-2xl font-semibold">{block ? "Edit route block" : "Create route block"}</h1>
    <p className="text-sm text-muted-foreground">Routes are allowed unless an active block applies. A block affects only its specified direction. Same-country blocks are supported.</p>
    <p className="text-sm text-amber-700 dark:text-amber-400">{ROLLOUT_WARNING}</p>
    <form className="space-y-6" onSubmit={event => { event.preventDefault(); setError(""); setPending({ ...values, reason: values.reason?.trim() || null }); }}>
      <fieldset disabled={mutation.isPending} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <CountryField label="From country" value={values.fromCountryCode} onChange={value => change("fromCountryCode", value)} />
          <CountryField label="To country" value={values.toCountryCode} onChange={value => change("toCountryCode", value)} />
        </div>
        <SelectField label="Transport type" value={values.transportType ?? ""} onChange={value => change("transportType", value ? value as TransportType : null)}>
          <option value="">All transport types</option>
          {Object.entries(TRANSPORT_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </SelectField>
        <label className="grid gap-2 text-sm font-medium">Internal reason (optional)
          <Textarea value={values.reason ?? ""} maxLength={1000} rows={4} onChange={event => change("reason", event.target.value)} />
          <span className="font-normal text-muted-foreground">Up to 1,000 characters. Not shown to mobile users.</span>
        </label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={values.isActive} onChange={event => change("isActive", event.target.checked)} />Active block</label>
        <p className="text-sm text-muted-foreground">Equivalent active blocks cannot be duplicated. Inactive blocks are retained for history.</p>
        <div className="flex gap-3"><Button type="submit">Review changes</Button><Button asChild variant="outline"><Link href="/route-blocks">Cancel</Link></Button></div>
      </fieldset>
    </form>
    <BlockConfirmation value={pending} busy={mutation.isPending} error={error} onCancel={() => setPending(null)} onConfirm={save} />
  </div>;
}
