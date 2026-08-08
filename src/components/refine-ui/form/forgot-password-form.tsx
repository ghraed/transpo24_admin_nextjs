"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import { useForgotPassword, useRefineOptions, useLink } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");

  const Link = useLink();

  const { title } = useRefineOptions();

  const { mutate: forgotPassword } = useForgotPassword();

  const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    forgotPassword({
      email,
    });
  };

  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "items-center",
        "justify-center",
        "px-6 bg-[radial-gradient(circle_at_top,_rgba(255,197,72,0.28),_transparent_28rem)]",
        "py-8",
        "min-h-svh"
      )}
    >
      <div className={cn("flex", "items-center", "justify-center", "gap-2")}>
        {title.icon && (
          <div
            className={cn("flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-foreground text-primary shadow-xl", "[&>svg]:w-8", "[&>svg]:h-8")}
          >
            {title.icon}
          </div>
        )}
      </div>

      <Card className={cn("w-full sm:w-[456px]", "p-7 sm:p-10", "mt-6 rounded-[1.75rem]")}>
        <CardHeader className={cn("px-0")}>
          <CardTitle
            className={cn(
              "text-foreground",
              "text-3xl",
              "font-semibold"
            )}
          >
            Forgot password
          </CardTitle>
          <CardDescription
            className={cn("text-muted-foreground", "font-medium")}
          >
            Enter your email to change your password.
          </CardDescription>
        </CardHeader>

        <CardContent className={cn("px-0")}>
          <form onSubmit={handleForgotPassword}>
            <div className={cn("flex", "flex-col", "gap-2")}>
              <Label htmlFor="email">Email</Label>
              <div className={cn("flex", "gap-2")}>
                <Input
                  id="email"
                  type="email"
                  placeholder=""
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn("flex-1")}
                />
                <Button
                  type="submit"
                  className={cn("px-6")}
                >
                  Send
                </Button>
              </div>
            </div>
          </form>

          <div className={cn("mt-8")}>
            <Link
              to="/login"
              className={cn(
                "inline-flex",
                "items-center",
                "gap-2",
                "text-sm",
                "text-muted-foreground",
                "hover:text-foreground",
                "transition-colors"
              )}
            >
              <ArrowLeft className={cn("w-4", "h-4")} />
              <span>Back</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

ForgotPasswordForm.displayName = "ForgotPasswordForm";
