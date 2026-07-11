"use client";

import { useGetIdentity } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = {
  id: string;
};

export default function AdminUserList() {
  const { data: currentUser } = useGetIdentity<CurrentUser>();

  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<AdminUser>();

    return [
      // columnHelper.accessor("id", {
      //   id: "id",
      //   header: "ID",
      //   enableSorting: false,
      // }),
      columnHelper.accessor("name", {
        id: "name",
        header: "Name",
        enableSorting: true,
      }),
      columnHelper.accessor("email", {
        id: "email",
        header: "Email",
        enableSorting: true,
      }),
      columnHelper.accessor("role", {
        id: "role",
        header: "Role",
        enableSorting: false,
        cell: ({ getValue }) => {
          const role = getValue();
          return <Badge variant="default">{role}</Badge>;
        },
      }),
      columnHelper.accessor("createdAt", {
        id: "createdAt",
        header: "Created At",
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue();
          return date ? new Date(date).toLocaleDateString() : "-";
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const isCurrentUser = row.original.id === currentUser?.id;

          return (
            <div className="flex gap-2">
              <EditButton recordItemId={row.original.id} size="sm" />
              <DeleteButton
                recordItemId={row.original.id}
                size="sm"
                disabled={isCurrentUser}
                title={
                  isCurrentUser
                    ? "You cannot delete your own admin account."
                    : undefined
                }
              />
            </div>
          );
        },
        enableSorting: false,
        size: 200,
      }),
    ];
  }, [currentUser?.id]);

  const table = useTable({
    columns,
    refineCoreProps: {
      syncWithLocation: true,
      dataProviderName: "adminUsers",
    },
  });

  return (
    <ListView>
      <ListViewHeader />
      <DataTable table={table} />
    </ListView>
  );
}
