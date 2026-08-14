"use client";

import { useForm } from "@refinedev/react-hook-form";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserPlus } from "lucide-react";

import { CreateView } from "@/components/refine-ui/views/create-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type AdminUserFormValues = {
  name: string;
  email: string;
  password: string;
};

export default function AdminUserCreate() {
  const router = useRouter();

  const {
    refineCore: { onFinish },
    ...form
  } = useForm<AdminUserFormValues>({
    refineCoreProps: {},
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values: unknown) {
    const payload = values as AdminUserFormValues;

    onFinish({
      ...payload,
    });
  }

  return (
    <CreateView className="gap-6">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-[#F1D58B] bg-[linear-gradient(135deg,#FFF9E8_0%,#FFFFFF_72%)] px-6 py-7 shadow-[0_10px_24px_-18px_rgba(17,24,39,0.28)] md:px-8 md:py-9">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <Badge className="rounded-full border-0 bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground shadow-none">
            Access management
          </Badge>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-4xl">
                Add an admin user
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground md:text-base">
                Create a secure account for a teammate who needs access to the Transpo24 operations workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="mx-auto w-full max-w-3xl rounded-[1.75rem] border-border bg-card shadow-[0_16px_30px_-22px_rgba(17,24,39,0.38)]">
        <CardHeader className="gap-3 px-6 pt-7 md:px-8 md:pt-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E5F6F1] text-[#087968]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl tracking-[-0.03em]">Account details</CardTitle>
            <CardDescription className="leading-6">
              Enter the user’s details and a password with at least eight characters.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-7 md:px-8 md:pb-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit as never)}
              className="space-y-7"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} placeholder="Full name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+$/i, message: "Enter a valid email address" },
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" value={field.value || ""} placeholder="name@company.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                rules={{
                  required: "Password is required",
                  minLength: { value: 8, message: "Password must be at least 8 characters" },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" value={field.value || ""} placeholder="At least 8 characters" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-end">
                <Button type="button" variant="outline" className="rounded-full px-6" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" {...form.saveButtonProps} disabled={form.formState.isSubmitting} className="rounded-full px-6">
                  <UserPlus className="h-4 w-4" />
                  {form.formState.isSubmitting ? "Creating account..." : "Create admin user"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </CreateView>
  );
}
