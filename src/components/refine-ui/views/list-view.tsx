"use client";

import type { PropsWithChildren } from "react";

import { useResourceParams, useUserFriendlyName } from "@refinedev/core";
import { Breadcrumb } from "@/components/refine-ui/layout/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { cn } from "@/lib/utils";

type ListViewProps = PropsWithChildren<{
  className?: string;
}>;

export function ListView({ children, className }: ListViewProps) {
  return (
    <div className={cn("flex flex-col", "gap-4", className)}>{children}</div>
  );
}

type ListHeaderProps = PropsWithChildren<{
  resource?: string;
  title?: string;
  canCreate?: boolean;
  headerClassName?: string;
  wrapperClassName?: string;
}>;

export const ListViewHeader = ({
  canCreate,
  resource: resourceFromProps,
  title: titleFromProps,
  wrapperClassName,
  headerClassName,
}: ListHeaderProps) => {
  const getUserFriendlyName = useUserFriendlyName();

  const { resource, identifier } = useResourceParams({
    resource: resourceFromProps,
  });
  const resourceName = identifier ?? resource?.name;

  const isCreateButtonVisible = canCreate ?? !!resource?.create;

  const title =
    titleFromProps ??
    getUserFriendlyName(
      resource?.meta?.label ?? identifier ?? resource?.name,
      "plural"
    );

  return (
    <div className={cn("flex flex-col gap-5", wrapperClassName)}>
      <div className="flex items-center gap-2">
        <div className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 backdrop-blur">
          <Breadcrumb />
        </div>
        <Separator className="flex-1 bg-border/70" />
      </div>
      <div
        className={cn(
          "rounded-[1.75rem] border border-white/55 bg-card/82 px-5 py-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] backdrop-blur md:px-6 md:py-6",
          "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
          headerClassName
        )}
      >
        <div className="space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Operations module
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Structured for fast review today and ready for more admin modules later without changing the page model.
          </p>
        </div>
        {isCreateButtonVisible && (
          <div className="flex items-center gap-2">
            <CreateButton resource={resourceName} />
          </div>
        )}
      </div>
    </div>
  );
};

ListView.displayName = "ListView";
