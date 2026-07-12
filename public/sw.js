self.addEventListener("push", (event) => {
  const payload = parsePushPayload(event);
  const title = payload.title || "Transpo24 Admin";
  const body = payload.body || "You have a new update.";
  const url = normalizeTargetUrl(payload.url);
  const options = {
    body,
    icon: typeof payload.icon === "string" ? payload.icon : undefined,
    badge: typeof payload.badge === "string" ? payload.badge : undefined,
    tag: typeof payload.tag === "string" ? payload.tag : undefined,
    data: {
      notificationId:
        typeof payload.id === "string" && payload.id.trim()
          ? payload.id.trim()
          : null,
      url,
      ...(isRecord(payload.data) ? payload.data : {}),
    },
  };

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, options),
      broadcastPushMessage({
        id:
          typeof payload.id === "string" && payload.id.trim()
            ? payload.id.trim()
            : null,
        type: typeof payload.type === "string" ? payload.type : null,
        title,
        body,
        url,
        data: isRecord(payload.data) ? payload.data : {},
      }),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = normalizeTargetUrl(event.notification.data?.url);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      const absoluteTargetUrl = toAbsoluteAppUrl(targetUrl);

      for (const client of windowClients) {
        if (!("url" in client) || typeof client.url !== "string") {
          continue;
        }

        if (!isSafeClientUrl(client.url)) {
          continue;
        }

        if ("focus" in client) {
          return client.focus().then(() => {
            if ("navigate" in client && shouldNavigateClient(client.url, absoluteTargetUrl)) {
              return client.navigate(absoluteTargetUrl);
            }

            return client;
          });
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(absoluteTargetUrl);
      }

      return undefined;
    }),
  );
});

function parsePushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    const parsed = event.data.json();
    return isRecord(parsed) ? parsed : {};
  } catch (_error) {
    try {
      const text = event.data.text();
      const parsed = JSON.parse(text);
      return isRecord(parsed) ? parsed : {};
    } catch (_secondError) {
      return {};
    }
  }
}

function broadcastPushMessage(message) {
  return clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((windowClients) =>
      Promise.all(
        windowClients
          .filter((client) => "url" in client && isSafeClientUrl(client.url))
          .map((client) =>
            client.postMessage({
              type: "WEB_PUSH_RECEIVED",
              payload: message,
            }),
          ),
      ),
    );
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeTargetUrl(rawUrl) {
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return "/";
  }

  const value = rawUrl.trim();

  if (value.startsWith("/admin/")) {
    return value.slice("/admin".length) || "/";
  }

  if (value === "/admin") {
    return "/";
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const parsed = new URL(value, self.location.origin);
    if (parsed.origin !== self.location.origin) {
      return "/";
    }

    return normalizeTargetUrl(`${parsed.pathname}${parsed.search}${parsed.hash}`);
  } catch (_error) {
    return "/";
  }
}

function toAbsoluteAppUrl(pathname) {
  return new URL(normalizeTargetUrl(pathname), self.location.origin).toString();
}

function isSafeClientUrl(clientUrl) {
  try {
    const parsed = new URL(clientUrl);
    return parsed.origin === self.location.origin;
  } catch (_error) {
    return false;
  }
}

function shouldNavigateClient(currentUrl, targetUrl) {
  return currentUrl !== targetUrl;
}
