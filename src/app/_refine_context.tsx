"use client";

import React from "react";
import { Refine, GitHubBanner } from "@refinedev/core";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider from "@refinedev/nextjs-router";

import { dataProvider } from "@providers/data-provider";
import { ErrorComponent } from "@/components/refine-ui/layout/error-component";
import { Layout } from "@/components/refine-ui/layout/layout";
import { Header } from "@/components/refine-ui/layout/header";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { Toaster } from "@/components/refine-ui/notification/toaster";
import { ThemeProvider } from "@/components/refine-ui/theme/theme-provider";
import "@/app/globals.css";
import { authProviderClient } from "@providers/auth-provider/auth-provider.client";
import { ClipboardCheck, Shield } from "lucide-react";

type RefineContextProps = {
  children: React.ReactNode;
};

export const RefineContext = ({ children }: RefineContextProps) => {
  const notificationProvider = useNotificationProvider();

  return (
    <RefineKbarProvider>
      <ThemeProvider>
        <Refine
          dataProvider={dataProvider}
          notificationProvider={notificationProvider}
          authProvider={authProviderClient}
          routerProvider={routerProvider}
          resources={[
            {
              name: "admin_users",
              identifier: "admin_users",
              list: "/admin-users",
              create: "/admin-users/create",
              edit: "/admin-users/edit/:id",
              meta: {
                canDelete: true,
                label: "Admin Users",
                icon: <Shield className="h-4 w-4" />,
                dataProviderName: "adminUsers",
              },
            },
            {
              name: "driver_reviews",
              identifier: "driver_reviews",
              list: "/driver-reviews",
              meta: {
                label: "Driver Requests",
                icon: <ClipboardCheck className="h-4 w-4" />,
                dataProviderName: "adminDriverReviews",
              },
            },
          ]}
          options={{
            syncWithLocation: true,
            warnWhenUnsavedChanges: true,
            title: {
              text: "Transpo24 Admin",
              icon: <Shield className="h-4 w-4" />,
            },
          }}
        >
          {children}
          <Toaster />
          <RefineKbar />
        </Refine>
      </ThemeProvider>
    </RefineKbarProvider>
  );
};
