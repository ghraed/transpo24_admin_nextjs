import test from "node:test";
import assert from "node:assert/strict";

import { getStatusFromState } from "./shared";

test("reports unsupported browsers first", () => {
  assert.equal(
    getStatusFromState({
      supported: false,
      configured: false,
      permission: "unsupported",
      subscription: null,
    }),
    "unsupported",
  );
});

test("reports missing VAPID configuration before subscription state", () => {
  assert.equal(
    getStatusFromState({
      supported: true,
      configured: false,
      permission: "default",
      subscription: null,
    }),
    "not-configured",
  );
});

test("reports granted permission without a subscription as not subscribed", () => {
  assert.equal(
    getStatusFromState({
      supported: true,
      configured: true,
      permission: "granted",
      subscription: null,
    }),
    "not-subscribed",
  );
});

test("reports an active subscription as subscribed", () => {
  assert.equal(
    getStatusFromState({
      supported: true,
      configured: true,
      permission: "granted",
      subscription: {} as PushSubscription,
    }),
    "subscribed",
  );
});

test("reports explicit loading and errors", () => {
  assert.equal(
    getStatusFromState({
      supported: true,
      configured: true,
      permission: "default",
      subscription: null,
      isLoading: true,
    }),
    "subscribing",
  );

  assert.equal(
    getStatusFromState({
      supported: true,
      configured: true,
      permission: "granted",
      subscription: null,
      errorMessage: "Sync failed",
    }),
    "error",
  );
});
