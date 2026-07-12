"use client";

import { axiosInstance, API_URL } from "../../providers/data-provider";
import Cookies from "js-cookie";

import {
  base64UrlToUint8Array,
  getBrowserSupportSnapshot,
  getStatusFromState,
  isWebPushSupported,
  serializePushSubscription,
} from "./shared";
import type { WebPushState, WebPushStatus } from "./types";

const TOKEN_COOKIE = "token";
const SERVICE_WORKER_URL = "/sw.js";

export function isSupported(): boolean {
  const snapshot = getBrowserSupportSnapshot({
    window: typeof window !== "undefined" ? window : undefined,
    navigator: typeof navigator !== "undefined" ? navigator : undefined,
    Notification:
      typeof Notification !== "undefined" ? Notification : undefined,
    PushManager: typeof PushManager !== "undefined" ? PushManager : undefined,
    isSecureContext:
      typeof window !== "undefined" ? window.isSecureContext : false,
  });

  return isWebPushSupported(snapshot);
}

export function getPermissionState(): NotificationPermission | "unsupported" {
  if (typeof Notification === "undefined") {
    return "unsupported";
  }

  return Notification.permission;
}

export function getVapidPublicKey(): string | null {
  const value = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
  return value ? value : null;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isSupported()) {
    return null;
  }

  return navigator.serviceWorker.register(SERVICE_WORKER_URL);
}

export async function getReadyServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await registerServiceWorker();

  if (!registration) {
    throw new Error("Browser Web Push is not supported in this environment.");
  }

  return navigator.serviceWorker.ready;
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isSupported()) {
    return null;
  }

  const registration = await getReadyServiceWorker();
  return registration.pushManager.getSubscription();
}

export async function showTestNotification(): Promise<void> {
  if (!isSupported()) {
    throw new Error("Browser Web Push is not supported in this environment.");
  }

  if (getPermissionState() !== "granted") {
    throw new Error("Browser notification permission has not been granted.");
  }

  const registration = await getReadyServiceWorker();

  await registration.showNotification("Transpo24 Test Notification", {
    body: "This is a local browser notification test from Driver Requests.",
    tag: "transpo24-admin-test-notification",
    data: {
      url: "/driver-reviews",
      source: "driver-reviews-test",
    },
  });
}

export async function requestPermissionAndSubscribe(): Promise<WebPushState> {
  if (!isSupported()) {
    return createState("unsupported", null, "Browser Web Push is unsupported.");
  }

  const vapidPublicKey = getVapidPublicKey();
  if (!vapidPublicKey) {
    return createState(
      "not-configured",
      null,
      "The browser Web Push public key is missing.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return createState(
      permission === "denied" ? "permission-denied" : "permission-default",
      null,
      permission === "denied"
        ? "Browser notification permission was denied."
        : null,
    );
  }

  const registration = await getReadyServiceWorker();
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(
        vapidPublicKey,
      ) as BufferSource,
    });
  }

  await syncSubscription(subscription);

  return createState("subscribed", subscription, null);
}

export async function syncExistingSubscription(): Promise<void> {
  if (!isSupported() || getPermissionState() !== "granted") {
    return;
  }

  const subscription = await getCurrentSubscription();

  if (!subscription) {
    return;
  }

  await syncSubscription(subscription);
}

export async function unsubscribe(): Promise<void> {
  if (!isSupported()) {
    return;
  }

  const subscription = await getCurrentSubscription();

  if (!subscription) {
    return;
  }

  await removeSubscriptionAssociation(subscription.endpoint);
  await subscription.unsubscribe().catch(() => undefined);
}

export async function cleanupWebPushOnLogout(): Promise<void> {
  if (!isSupported()) {
    return;
  }

  const token = Cookies.get(TOKEN_COOKIE);
  if (!token) {
    return;
  }

  const subscription = await getCurrentSubscription().catch(() => null);

  if (!subscription) {
    return;
  }

  await removeSubscriptionAssociation(subscription.endpoint).catch(
    () => undefined,
  );
  await subscription.unsubscribe().catch(() => undefined);
}

export function getDevConfigurationWarning(): string | null {
  const vapidPublicKey = getVapidPublicKey();

  if (!vapidPublicKey) {
    return "NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY is not configured.";
  }

  try {
    base64UrlToUint8Array(vapidPublicKey);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Invalid VAPID public key.";
  }
}

async function syncSubscription(subscription: PushSubscription): Promise<void> {
  const payload = serializePushSubscription(subscription, navigator.userAgent);

  await axiosInstance.post(
    `${API_URL}/notifications/web-push/subscriptions`,
    payload,
  );
}

async function removeSubscriptionAssociation(endpoint: string): Promise<void> {
  await axiosInstance.delete(`${API_URL}/notifications/web-push/subscriptions`, {
    data: {
      endpoint,
    },
  });
}

function createState(
  status: WebPushStatus,
  subscription: PushSubscription | null,
  errorMessage: string | null,
): WebPushState {
  const supported = isSupported();
  const configured = Boolean(getVapidPublicKey());
  const permission = getPermissionState();

  return {
    status,
    permission,
    isSupported: supported,
    isConfigured: configured,
    isSubscribed: Boolean(subscription),
    subscription,
    errorMessage,
  };
}
