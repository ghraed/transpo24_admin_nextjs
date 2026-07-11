"use client";

import { useForm } from "@refinedev/react-hook-form";
import { useRouter } from "next/navigation";

import { EditView } from "@/components/refine-ui/views/edit-view";
import { Button } from "@/components/ui/button";
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
  password?: string;
};

export default function AdminUserEdit() {
  const router = useRouter();

  const {
    refineCore: { onFinish, query },
    ...form
  } = useForm<AdminUserFormValues>({
    refineCoreProps: {},
  });

  const adminUserData = query?.data?.data;

  function onSubmit(values: unknown) {
    const payload = {
      ...(values as AdminUserFormValues),
    };
    if (!payload.password || payload.password.length === 0) {
      delete payload.password;
    }
    onFinish(payload);
  }

  return (
    <EditView>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit as never)}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="name"
            rules={{ required: "Name is required" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ""}
                    placeholder="Enter name"
                  />
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
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Invalid email address",
              },
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    value={field.value || ""}
                    placeholder="Enter email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    value={field.value || ""}
                    placeholder="Leave blank to keep current password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button
              type="submit"
              {...form.saveButtonProps}
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Updating..." : "Update"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </EditView>
  );
}
