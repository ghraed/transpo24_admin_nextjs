import type { Metadata } from "next";
import React, { Suspense } from "react";
import { RefineContext } from "./_refine_context";

export const metadata: Metadata = {
  title: "Transpo24 Admin",
  description: "Operations console for admin users and driver requests.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Suspense>
          <RefineContext>{children}</RefineContext>
        </Suspense>
      </body>
    </html>
  );
}
