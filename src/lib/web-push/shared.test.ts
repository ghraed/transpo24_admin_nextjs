import test from "node:test";
import assert from "node:assert/strict";

import {
  base64UrlToUint8Array,
  getBrowserSupportSnapshot,
  isWebPushSupported,
  normalizeNotificationTargetPath,
  normalizePushPayload,
  serializePushSubscription,
} from "./shared";

test("detects missing browser support pieces", () => {
  const snapshot = getBrowserSupportSnapshot({
    window: {} as Window,
    navigator: {} as Navigator,
    Notification: undefined,
    PushManager: undefined,
    isSecureContext: false,
  });

  assert.equal(isWebPushSupported(snapshot), false);
});

test("converts URL-safe Base64 VAPID keys to Uint8Array", () => {
  const converted = base64UrlToUint8Array("SGVsbG8");
  assert.deepEqual(Array.from(converted), [72, 101, 108, 108, 111]);
});

test("rejects malformed VAPID keys", () => {
  assert.throws(
    () => base64UrlToUint8Array("bad key!"),
    /malformed/,
  );
});

test("serializes push subscriptions with required keys", () => {
  const serialized = serializePushSubscription(
    {
      endpoint: "https://push.example.com/subscription",
      expirationTime: null,
      toJSON: () => ({
        keys: {
          p256dh: "p256dh-key",
          auth: "auth-key",
        },
      }),
    },
    "Browser UA",
  );

  assert.deepEqual(serialized, {
    endpoint: "https://push.example.com/subscription",
    expirationTime: null,
    keys: {
      p256dh: "p256dh-key",
      auth: "auth-key",
    },
    userAgent: "Browser UA",
  });
});

test("rejects subscriptions missing required keys", () => {
  assert.throws(
    () =>
      serializePushSubscription(
        {
          endpoint: "https://push.example.com/subscription",
          expirationTime: null,
          toJSON: () => ({
            keys: {
              p256dh: "",
              auth: "",
            },
          }),
        },
        "Browser UA",
      ),
    /missing required keys/,
  );
});

test("normalizes admin-prefixed and external notification routes safely", () => {
  assert.equal(normalizeNotificationTargetPath("/admin/driver-reviews"), "/driver-reviews");
  assert.equal(normalizeNotificationTargetPath("https://evil.example.com/phish"), "/");
  assert.equal(normalizeNotificationTargetPath("https://admin.transpo24.local/admin-users"), "/admin-users");
});

test("applies fallback notification payload values", () => {
  assert.deepEqual(
    normalizePushPayload({
      url: "https://evil.example.com/phish",
    }),
    {
      url: "/",
      title: "Transpo24 Admin",
      body: "You have a new update.",
    },
  );
});
