import { API_URL } from "../api/config";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN";
};

/** Decode only to locate the account. The backend verifies the signed token. */
function getSubject(token: string): string | null {
  try {
    const parts = token.split(".");
    // The API accepts both its legacy payload.signature and JWT formats.
    if (parts.length !== 2 && parts.length !== 3) return null;
    const encoded = parts[parts.length === 3 ? 1 : 0];
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function validateAdminSession(
  token: string | undefined,
  request: typeof fetch = fetch,
): Promise<AdminUser | null> {
  if (!token) return null;
  const subject = getSubject(token);
  if (!subject) return null;

  const response = await request(`${API_URL}/admin/users/${encodeURIComponent(subject)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if ([401, 403, 404].includes(response.status)) return null;
  // An outage must not be treated as an invalid session or erase credentials.
  if (!response.ok) throw new Error("Unable to verify your session. Please try again.");
  const user = await response.json();
  if (user?.id !== subject || user?.role !== "ADMIN" || user?.deletedAt ||
    typeof user.name !== "string" || typeof user.email !== "string") return null;
  return { id: user.id, name: user.name, email: user.email, role: "ADMIN" };
}
