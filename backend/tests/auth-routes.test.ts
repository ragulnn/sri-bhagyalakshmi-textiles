import { test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { setupAuth } from "../auth.js";

async function fixture() {
  const dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "textiles-auth-"));
  const app = express();
  app.use(express.json());

  // Allow admin routes in tests. No production admin credentials are used.
  setupAuth(app, dataDir, (_req, _res, next) => next());

  const server: Server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  async function request(
    route: string,
    method = "GET",
    body?: unknown,
    token?: string
  ) {
    const response = await fetch(`${baseUrl}${route}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });

    return {
      status: response.status,
      body: await response.json() as any,
      headers: response.headers
    };
  }

  async function close() {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await fs.rm(dataDir, { recursive: true, force: true });
  }

  return { request, close };
}

async function register(f: Awaited<ReturnType<typeof fixture>>, phone = "9876543210") {
  return f.request("/api/auth/register", "POST", {
    name: "Test Customer",
    phone,
    email: "customer@example.com",
    address: "Salem",
    password: "StrongPass123"
  });
}

test("registration creates a user and returns a session token", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  const result = await register(f);

  assert.equal(result.status, 200);
  assert.ok(result.body.token);
  assert.equal(result.body.user.phone, "9876543210");
  assert.equal(result.body.user.name, "Test Customer");
  assert.deepEqual(result.body.user.favourites, []);
  assert.equal("pwHash" in result.body.user, false);
  assert.equal("pwSalt" in result.body.user, false);
});

test("registration rejects invalid input", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  const missingName = await f.request("/api/auth/register", "POST", {
    name: "   ", phone: "9876543210", password: "StrongPass123"
  });
  assert.equal(missingName.status, 400);

  const badPhone = await f.request("/api/auth/register", "POST", {
    name: "Customer", phone: "123", password: "StrongPass123"
  });
  assert.equal(badPhone.status, 400);

  const badEmail = await f.request("/api/auth/register", "POST", {
    name: "Customer", phone: "9876543210",
    email: "not-an-email", password: "StrongPass123"
  });
  assert.equal(badEmail.status, 400);

  const shortPassword = await f.request("/api/auth/register", "POST", {
    name: "Customer", phone: "9876543210", password: "short"
  });
  assert.equal(shortPassword.status, 400);
});

test("registration rejects duplicate phone numbers", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  assert.equal((await register(f)).status, 200);
  const duplicate = await register(f, "+91 9876543210");

  assert.equal(duplicate.status, 409);
});

test("login accepts valid credentials and rejects invalid credentials", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  await register(f);

  const wrongPassword = await f.request("/api/auth/login", "POST", {
    phone: "9876543210", password: "WrongPassword123"
  });
  assert.equal(wrongPassword.status, 401);

  const wrongPhone = await f.request("/api/auth/login", "POST", {
    phone: "9123456789", password: "StrongPass123"
  });
  assert.equal(wrongPhone.status, 401);

  const login = await f.request("/api/auth/login", "POST", {
    phone: "+91 9876543210", password: "StrongPass123"
  });
  assert.equal(login.status, 200);
  assert.ok(login.body.token);
  assert.equal(login.body.user.phone, "9876543210");
});

test("profile route requires a valid session", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  const anonymous = await f.request("/api/me");
  assert.equal(anonymous.status, 401);

  await register(f);
  const invalidToken = await f.request("/api/me", "GET", undefined, "not-a-token");
  assert.equal(invalidToken.status, 401);
});

test("customer can update their profile and favourites", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  const registration = await register(f);
  const token = registration.body.token;

  const profile = await f.request("/api/me", "PUT", {
    name: "Updated Customer",
    email: "updated@example.com",
    address: "New address"
  }, token);

  assert.equal(profile.status, 200);
  assert.equal(profile.body.user.name, "Updated Customer");
  assert.equal(profile.body.user.email, "updated@example.com");

  const favourites = await f.request("/api/me/favourites", "PUT", {
    ids: ["saree-1", "saree-2", "saree-1"]
  }, token);

  assert.equal(favourites.status, 200);
  assert.deepEqual(favourites.body.favourites, ["saree-1", "saree-2"]);

  const invalidFavourites = await f.request("/api/me/favourites", "PUT", {
    ids: ["saree-1", ""]
  }, token);
  assert.equal(invalidFavourites.status, 400);

  const invalidProfile = await f.request("/api/me", "PUT", {
    name: "   ", email: "bad-email", address: ""
  }, token);
  assert.equal(invalidProfile.status, 400);
});

test("logout invalidates the session", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  const registration = await register(f);
  const token = registration.body.token;

  assert.equal((await f.request("/api/me", "GET", undefined, token)).status, 200);

  const logout = await f.request("/api/auth/logout", "POST", {});
  assert.equal(logout.status, 200);
  assert.equal(logout.body.ok, true);

  // Logout without the token above does not invalidate this user's session.
  const stillLoggedIn = await f.request("/api/me", "GET", undefined, token);
  assert.equal(stillLoggedIn.status, 200);

  await f.request("/api/auth/logout", "POST", {}, token);
  const loggedOut = await f.request("/api/me", "GET", undefined, token);
  assert.equal(loggedOut.status, 401);
});

test("admin routes can list, reset, and delete customers", async (t) => {
  const f = await fixture();
  t.after(() => f.close());

  const registration = await register(f);
  const userId = registration.body.user.id;
  const token = registration.body.token;

  const list = await f.request("/api/admin/customers");
  assert.equal(list.status, 200);
  assert.equal(list.body.customers.length, 1);
  assert.equal(list.headers.get("cache-control"), "no-store");

  const badPassword = await f.request(
    `/api/admin/customers/${userId}/password`, "POST", { password: "short" }
  );
  assert.equal(badPassword.status, 400);

  const reset = await f.request(
    `/api/admin/customers/${userId}/password`, "POST",
    { password: "NewStrongPass123" }
  );
  assert.equal(reset.status, 200);

  // A password reset revokes all existing sessions.
  assert.equal((await f.request("/api/me", "GET", undefined, token)).status, 401);

  const login = await f.request("/api/auth/login", "POST", {
    phone: "9876543210", password: "NewStrongPass123"
  });
  assert.equal(login.status, 200);

  const deleted = await f.request(`/api/admin/customers/${userId}`, "DELETE");
  assert.equal(deleted.status, 200);

  const missing = await f.request(`/api/admin/customers/${userId}`, "DELETE");
  assert.equal(missing.status, 404);
});
