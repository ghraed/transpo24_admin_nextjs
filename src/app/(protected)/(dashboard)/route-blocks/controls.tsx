"use client";

import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { COUNTRIES, directionLabel, LIFECYCLE_WARNING, typeLabel, type RouteBlockValues } from "@/lib/route-blocks";
import { useId, type ReactNode } from "react";

export function SelectField({ label, value, onChange, children, required = false }: {
  label: string; value: string; onChange: (value: string) => void; children: ReactNode; required?: boolean;
}) {
  const id = useId();
  return <div className="grid gap-2 text-sm font-medium"><label htmlFor={id}>{label}</label>
    <select id={id} required={required} value={value} onChange={event => onChange(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-foreground">
      {children}
    </select>
  </div>;
}
export function CountryField({ label, value, onChange, filter = false }: {
  label: string; value: string; onChange: (value: string) => void; filter?: boolean;
}) {
  return <SelectField label={label} value={value} onChange={onChange} required={!filter}>
    <option value="">{filter ? "Any country" : "Select country"}</option>
    {COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.label}</option>)}
  </SelectField>;
}
export function BlockConfirmation({ value, busy, error, onCancel, onConfirm }: {
  value: RouteBlockValues | null; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void;
}) {
  return <AlertDialog open={!!value} onOpenChange={open => { if (!open && !busy) onCancel(); }}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{value?.isActive ? "Confirm active route block" : "Confirm inactive route block"}</AlertDialogTitle>
        <AlertDialogDescription asChild>
          <div className="space-y-3">
            {value && <><p>{value.isActive ? "You are blocking:" : "You are saving an inactive block:"}</p>
              <p className="font-semibold text-foreground">{directionLabel(value)}<br />{typeLabel(value.transportType)}</p>
              {value.fromCountryCode !== value.toCountryCode && <p>The reverse direction is unchanged. It remains allowed unless a separate active block applies.</p>}
              {!value.isActive && <p>Other active blocks may still make this route unavailable.</p>}
            </>}
            <p>{LIFECYCLE_WARNING}</p>
          </div>
        </AlertDialogDescription>
      </AlertDialogHeader>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <AlertDialogFooter>
        <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
        <Button disabled={busy} onClick={onConfirm}>{busy ? "Saving…" : "Confirm and save"}</Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
