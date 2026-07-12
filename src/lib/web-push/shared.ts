import type {
  BrowserPushNotificationPayload,
  BrowserPushSubscriptionInput,
  BrowserSupportSnapshot,
} from "./types";

export function getBrowserSupportSnapshot(
  runtime: Partial<{
    window: Window;
    navigator: Navigator;
    Notification: typeof Notification;
    PushManager: typeof PushManager;
    isSecureContext: boolean;
  }> = {},
): BrowserSupportSnapshot {
  const hasWindow = typeof runtime.window !== "undefined";
  const hasNotification = typeof runtime.Notification !== "undefined";
  const hasServiceWorker = Boolean(runtime.navigator?.serviceWorker);
  const hasPushManager = typeof runtime.PushManager !== "undefined";
  const isSecureContext = runtime.isSecureContext === true;

  return {
    hasWindow,
    hasNotification,
    hasServiceWorker,
    hasPushManager,
    isSecureContext,
  };
}

export function isWebPushSupported(
  snapshot: BrowserSupportSnapshot,
): boolean {
  return (
    snapshot.hasWindow &&
    snapshot.hasNotification &&
    snapshot.hasServiceWorker &&
    snapshot.hasPushManager &&
    snapshot.isSecureContext
  );
}

export function base64UrlToUint8Array(value: string): Uint8Array {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("Web Push VAPID public key is missing.");
  }

  if (!/^[A-Za-z0-9\-_]+$/.test(normalized)) {
    throw new Error("Web Push VAPID public key is malformed.");
  }

  const base64 = normalized.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4 || 4)) % 4;
  const padded = `${base64}${"=".repeat(padding)}`;

  try {
    const binary =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("binary");
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch (_error) {
    throw new Error("Web Push VAPID public key could not be decoded.");
  }
}

export function normalizeNotificationTargetPath(
  rawUrl: string | null | undefined,
): string {
  if (!rawUrl) {
    return "/";
  }

  const value = rawUrl.trim();

  if (!value) {
    return "/";
  }

  if (value === "/admin") {
    return "/";
  }

  if (value.startsWith("/admin/")) {
    return value.slice("/admin".length) || "/";
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value, "https://admin.transpo24.local");
    if (parsed.origin !== "https://admin.transpo24.local") {
      return "/";
    }

    return normalizeNotificationTargetPath(
      `${parsed.pathname}${parsed.search}${parsed.hash}`,
    );
  } catch (_error) {
    return "/";
  }
}

export function serializePushSubscription(
  subscription: Pick<PushSubscription, "endpoint" | "expirationTime" | "toJSON">,
  userAgent: string,
): BrowserPushSubscriptionInput {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh?.trim();
  const auth = json.keys?.auth?.trim();

  if (!p256dh || !auth) {
    throw new Error("The browser push subscription is missing required keys.");
  }

  return {
    endpoint: subscription.endpoint,
    expirationTime:
      typeof subscription.expirationTime === "number"
        ? subscription.expirationTime
        : null,
    keys: {
      p256dh,
      auth,
    },
    userAgent,
  };
}

export function normalizePushPayload(
  payload: BrowserPushNotificationPayload | null | undefined,
): Required<
  Pick<BrowserPushNotificationPayload, "title" | "body" | "url">
> &
  BrowserPushNotificationPayload {
  return {
    ...payload,
    title: payload?.title?.trim() || "Transpo24 Admin",
    body: payload?.body?.trim() || "You have a new update.",
    url: normalizeNotificationTargetPath(payload?.url),
  };
}

export function getStatusFromState(input: {
  supported: boolean;
  configured: boolean;
  permission: NotificationPermission | "unsupported";
  subscription: PushSubscription | null;
  isLoading?: boolean;
  errorMessage?: string | null;
}): import("./types").WebPushStatus {
  if (!input.supported) {
    return "unsupported";
  }

  if (!input.configured) {
    return "not-configured";
  }

  if (input.isLoading) {
    return "subscribing";
  }

  if (input.errorMessage) {
    return "error";
  }

  if (input.permission === "denied") {
    return "permission-denied";
  }

  if (input.permission === "default") {
    return "permission-default";
  }

  if (input.subscription) {
    return "subscribed";
  }

  return "not-subscribed";
}
