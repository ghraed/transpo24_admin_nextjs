import assert from "node:assert/strict";
import test from "node:test";
import { validateAdminSession } from "./session";

const admin = { id: "admin-test", name: "Test Admin", email: "admin@example.test", role: "ADMIN", deletedAt: null };
const payload = Buffer.from(JSON.stringify({ sub: admin.id })).toString("base64url");
const tokens = [`${payload}.signature`, `eyJhbGciOiJIUzI1NiJ9.${payload}.signature`];
const reply = (data: unknown, status = 200): typeof fetch => async () => Response.json(data, { status });

for (const token of tokens) {
  test(`validates ${token.split(".").length === 2 ? "legacy" : "JWT"} tokens with the backend`, async () => {
    let called = false;
    const user = await validateAdminSession(token, async (url, options) => {
      called = true;
      assert.ok(String(url).endsWith("/admin/users/admin-test"));
      assert.equal(new Headers(options?.headers).get("Authorization"), `Bearer ${token}`);
      assert.equal(options?.cache, "no-store");
      return Response.json(admin);
    });
    assert.ok(called);
    assert.deepEqual(user, { id: admin.id, name: admin.name, email: admin.email, role: "ADMIN" });
  });
}

test("missing and malformed tokens never request account data", async () => {
  const unexpected: typeof fetch = async () => { throw new Error("Unexpected request"); };
  for (const token of [undefined, "", "invalid", "bad.signature", "e30.signature"]) {
    assert.equal(await validateAdminSession(token, unexpected), null);
  }
});

test("a decoded subject never grants access after backend rejection", async () => {
  for (const status of [401, 403, 404]) {
    assert.equal(await validateAdminSession(tokens[0], reply({}, status)), null);
  }
});

test("rejects non-admin, mismatched and deactivated identities", async () => {
  for (const user of [
    { ...admin, role: "DRIVER" },
    { ...admin, id: "another-admin" },
    { ...admin, deletedAt: "2026-09-25T00:00:00Z" },
    { ...admin, name: null },
  ]) assert.equal(await validateAdminSession(tokens[0], reply(user)), null);
});

test("backend outages remain retryable errors, not invalid sessions", async () => {
  await assert.rejects(validateAdminSession(tokens[0], reply({}, 503)), /Unable to verify/);
  await assert.rejects(validateAdminSession(tokens[0], async () => { throw new Error("Offline"); }), /Offline/);
});
