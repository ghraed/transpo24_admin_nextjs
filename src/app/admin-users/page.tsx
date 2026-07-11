"use client";

import { useCustomMutation, useGetIdentity, useInvalidate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";
import { Loader2, RotateCcw } from "lucide-react";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Badge } from "@/components/ui/badge";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { DeleteButton } from "@/components/refine-ui/buttons/delete";
import { Button } from "@/components/ui/button";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type CurrentUser = {
  id: string;
};

export default function AdminUserList() {
  const { data: currentUser } = useGetIdentity<CurrentUser>();
  const invalidate = useInvalidate();
  const { mutate: reactivateUser, mutation: reactivateMutation } =
    useCustomMutation();
  const isReactivating = reactivateMutation.isPending;

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
        cell: ({ row, getValue }) => {
          const role = getValue();
          const isDeleted = Boolean(row.original.deletedAt);

          return (
            <div className="flex gap-2">
              <Badge variant="default">{role}</Badge>
              {isDeleted && <Badge variant="secondary">Inactive</Badge>}
            </div>
          );
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
          const isDeleted = Boolean(row.original.deletedAt);

          return (
            <div className="flex gap-2">
              <EditButton
                recordItemId={row.original.id}
                size="sm"
                disabled={isDeleted}
                title={isDeleted ? "Reactivate this admin user to edit it." : undefined}
              />
              {isDeleted ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isReactivating}
                  onClick={() => {
                    reactivateUser(
                      {
                        url: `/admin/users/${row.original.id}/reactivate`,
                        method: "post",
                        values: {},
                        dataProviderName: "adminUsers",
                      },
                      {
                        onSuccess: () => {
                          invalidate({
                            resource: "admin_users",
                            invalidates: ["list", "detail"],
                          });
                        },
                      }
                    );
                  }}
                >
                  {isReactivating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  Reactivate
                </Button>
              ) : (
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
              )}
            </div>
          );
        },
        enableSorting: false,
        size: 200,
      }),
    ];
  }, [currentUser?.id, invalidate, isReactivating, reactivateUser]);

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
