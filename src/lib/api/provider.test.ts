import assert from "node:assert/strict";
import test from "node:test";
import { AxiosError } from "axios";
import { axiosInstance } from "./client";
import { createAdminProvider } from "./provider";

test("list adapters preserve query strings and wrap legacy review arrays", async () => {
  const previous = axiosInstance.defaults.adapter;
  axiosInstance.defaults.adapter = async config => {
    assert.ok(config.url?.endsWith("/admin/driver-reviews?page=2"));
    assert.equal(config.method, "get");
    return { data: [{ id: "review-1" }], status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const provider = createAdminProvider("/admin/driver-reviews", ["get", "post"], true);
    assert.deepEqual(await provider.custom!({ url: "/admin/driver-reviews?page=2", method: "get" }), { data: { items: [{ id: "review-1" }] } });
  } finally { axiosInstance.defaults.adapter = previous; }
});

test("mutations send Refine payloads without changing response shape", async () => {
  const previous = axiosInstance.defaults.adapter;
  axiosInstance.defaults.adapter = async config => {
    assert.equal(config.method, "patch");
    assert.deepEqual(JSON.parse(config.data), { isActive: false });
    return { data: { id: "block-1", isActive: false }, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const provider = createAdminProvider("/admin/route-blocks", ["get", "patch"]);
    assert.deepEqual(await provider.custom!({ url: "/admin/route-blocks/block-1", method: "patch", payload: { isActive: false } }), { data: { id: "block-1", isActive: false } });
  } finally { axiosInstance.defaults.adapter = previous; }
});

test("domain adapters reject unrelated endpoints and unsupported methods", async () => {
  const provider = createAdminProvider("/admin/chat-reports", ["get", "put"]);
  for (const params of [
    { url: "/admin/chat-reports-other", method: "get" as const },
    { url: "https://example.test/admin/chat-reports", method: "get" as const },
    { url: "/admin/users", method: "get" as const },
    { url: "/admin/chat-reports/one", method: "delete" as const },
  ]) await assert.rejects(provider.custom!(params), { message: "Unsupported admin endpoint or method." });
});

test("API errors preserve status and business error codes for the UI", async () => {
  const previous = axiosInstance.defaults.adapter;
  axiosInstance.defaults.adapter = async config => {
    throw new AxiosError("Conflict", "ERR_BAD_REQUEST", config, undefined, {
      status: 409, statusText: "Conflict", headers: {}, config,
      data: { code: "ROUTE_BLOCK_DUPLICATE", message: "An active block already exists." },
    });
  };
  try {
    const provider = createAdminProvider("/admin/route-blocks", ["post"]);
    await assert.rejects(provider.custom!({ url: "/admin/route-blocks", method: "post", payload: {} }), {
      statusCode: 409,
      message: "An active block already exists.",
      errors: { code: "ROUTE_BLOCK_DUPLICATE", message: "An active block already exists." },
    });
  } finally { axiosInstance.defaults.adapter = previous; }
});
