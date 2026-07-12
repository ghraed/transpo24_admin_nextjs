export type WebPushStatus =
  | "unsupported"
  | "not-configured"
  | "permission-default"
  | "permission-denied"
  | "permission-granted"
  | "subscribing"
  | "subscribed"
  | "not-subscribed"
  | "error";

export interface BrowserPushSubscriptionInput {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export interface BrowserPushNotificationPayload {
  id?: string;
  title?: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  data?: Record<string, string | number | boolean | null>;
}

export interface WebPushState {
  status: WebPushStatus;
  permission: NotificationPermission | "unsupported";
  isSupported: boolean;
  isConfigured: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  errorMessage: string | null;
}

export interface BrowserSupportSnapshot {
  hasWindow: boolean;
  hasNotification: boolean;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  isSecureContext: boolean;
}
