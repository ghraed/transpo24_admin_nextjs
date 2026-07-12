"use client";

import React from "react";
import { useGetIdentity } from "@refinedev/core";
import { toast } from "sonner";

import {
  getCurrentSubscription,
  getDevConfigurationWarning,
  getPermissionState,
  getStatusFromState,
  getVapidPublicKey,
  isSupported,
  registerServiceWorker,
  requestPermissionAndSubscribe,
  syncExistingSubscription,
  unsubscribe,
} from "@/lib/web-push";
import type { WebPushState } from "@/lib/web-push";

type AdminIdentity = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
};

type WebPushContextValue = WebPushState & {
  enableNotifications: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  refresh: () => Promise<void>;
};

type IncomingWebPushMessage = {
  id?: string | null;
  type?: string | null;
  title?: string | null;
  body?: string | null;
  url?: string | null;
  data?: Record<string, string | number | boolean | null>;
};

const WEB_PUSH_EVENT_NAME = "transpo24:web-push-received";

const WebPushContext = React.createContext<WebPushContextValue | null>(null);

export function WebPushProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: identity } = useGetIdentity<AdminIdentity>();
  const [state, setState] = React.useState<WebPushState>({
    status: "unsupported",
    permission: "unsupported",
    isSupported: false,
    isConfigured: false,
    isSubscribed: false,
    subscription: null,
    errorMessage: null,
  });
  const warnedAboutConfiguration = React.useRef(false);

  const refresh = React.useCallback(async () => {
    const supported = isSupported();
    const configured = Boolean(getVapidPublicKey());
    const permission = getPermissionState();

    if (!supported) {
      setState({
        status: "unsupported",
        permission,
        isSupported: false,
        isConfigured: configured,
        isSubscribed: false,
        subscription: null,
        errorMessage: null,
      });
      return;
    }

    const subscription =
      permission === "granted" ? await getCurrentSubscription() : null;

    setState({
      status: getStatusFromState({
        supported,
        configured,
        permission,
        subscription,
      }),
      permission,
      isSupported: supported,
      isConfigured: configured,
      isSubscribed: Boolean(subscription),
      subscription,
      errorMessage: null,
    });
  }, []);

  React.useEffect(() => {
    void registerServiceWorker().catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    if (warnedAboutConfiguration.current) {
      return;
    }

    const warning = getDevConfigurationWarning();
    if (!warning) {
      return;
    }

    warnedAboutConfiguration.current = true;
    console.warn(`[WebPush] ${warning}`);
  }, []);

  React.useEffect(() => {
    if (!identity?.id) {
      void refresh();
      return;
    }

    void refresh().then(async () => {
      if (getPermissionState() !== "granted") {
        return;
      }

      try {
        await syncExistingSubscription();
        await refresh();
      } catch (error) {
        setState((current) => ({
          ...current,
          status: "error",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Failed to synchronize browser notifications.",
        }));
      }
    });
  }, [identity?.id, refresh]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const handledMessageIds = new Set<string>();

    const onMessage = (event: MessageEvent) => {
      const message = event.data;
      if (!message || message.type !== "WEB_PUSH_RECEIVED") {
        return;
      }

      const payload = (message.payload ?? {}) as IncomingWebPushMessage;

      if (payload.id && handledMessageIds.has(payload.id)) {
        return;
      }

      if (payload.id) {
        handledMessageIds.add(payload.id);
      }

      const title = payload.title?.trim() || "Transpo24 Admin";
      const body = payload.body?.trim();
      const description = body && body !== title ? body : undefined;

      toast(title, {
        description,
        richColors: true,
      });

      window.dispatchEvent(
        new CustomEvent(WEB_PUSH_EVENT_NAME, {
          detail: payload,
        }),
      );
    };

    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  const enableNotifications = React.useCallback(async () => {
    setState((current) => ({
      ...current,
      status: "subscribing",
      errorMessage: null,
    }));

    try {
      const nextState = await requestPermissionAndSubscribe();
      setState(nextState);

      if (nextState.status === "subscribed") {
        toast.success("Browser notifications are enabled on this browser.");
      } else if (nextState.status === "permission-denied") {
        toast.error(
          "Browser notifications were denied. Update the browser site settings to enable them later.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to enable browser notifications.";
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: message,
      }));
      toast.error(message);
    }
  }, []);

  const disableNotifications = React.useCallback(async () => {
    try {
      await unsubscribe();
      await refresh();
      toast.success("Browser notifications were disabled on this browser.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to disable browser notifications.";
      setState((current) => ({
        ...current,
        status: "error",
        errorMessage: message,
      }));
      toast.error(message);
    }
  }, [refresh]);

  const value = React.useMemo<WebPushContextValue>(
    () => ({
      ...state,
      enableNotifications,
      disableNotifications,
      refresh,
    }),
    [disableNotifications, enableNotifications, refresh, state],
  );

  return (
    <WebPushContext.Provider value={value}>{children}</WebPushContext.Provider>
  );
}

export function useWebPushNotifications(): WebPushContextValue {
  const context = React.useContext(WebPushContext);

  if (!context) {
    throw new Error(
      "useWebPushNotifications must be used within WebPushProvider.",
    );
  }

  return context;
}

export { WEB_PUSH_EVENT_NAME };
