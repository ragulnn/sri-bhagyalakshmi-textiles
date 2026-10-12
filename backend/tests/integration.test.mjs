import { test } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:13000";
const ADMIN_PASSWORD = "integration-test-admin-password";

async function request(path, options = {}) {
  return fetch(`${BASE_URL}${path}`, options);
}

async function getAdminToken() {
  const response = await request("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(typeof data.token, "string");
  return data.token;
}

test("health endpoint returns OK", async () => {
  const response = await request("/healthz");

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "ok");
});

test("catalogue endpoint returns categories and sarees", async () => {
  const response = await request("/api/store");

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.ok(Array.isArray(data.categories));
  assert.ok(Array.isArray(data.sarees));
});

test("admin catalogue endpoint rejects requests without a token", async () => {
  const response = await request("/api/admin/store", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ categories: [], sarees: [] }),
  });

  assert.equal(response.status, 401);
});

test("admin login rejects an incorrect password", async () => {
  const response = await request("/api/admin/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: "definitely-the-wrong-password" }),
  });

  assert.equal(response.status, 401);
});

test("admin login accepts the isolated test password", async () => {
  await getAdminToken();
});

test("catalogue validation rejects invalid input", async () => {
  const token = await getAdminToken();

  const response = await request("/api/admin/store", {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ categories: "not-an-array", sarees: [] }),
  });

  assert.equal(response.status, 400);
});

test("valid catalogue updates persist in the isolated test database", async () => {
  const token = await getAdminToken();

  const catalogue = {
    categories: [
      {
        id: "ci-category",
        name: "CI Test Category",
        heroImage: "",
      },
    ],
    sarees: [
      {
        id: "ci-saree",
        sku: "CI-TEST-001",
        name: "CI Test Saree",
        price: 999,
        categoryId: "ci-category",
        mainImage: "",
        fullSareeLayImage: "",
        galleryImages: [],
      },
    ],
  };

  const update = await request("/api/admin/store", {
    method: "PUT",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(catalogue),
  });

  assert.equal(update.status, 200);

  const response = await request("/api/store");
  assert.equal(response.status, 200);

  const saved = await response.json();
  assert.ok(saved.categories.some((item) => item.id === "ci-category"));
  assert.ok(saved.sarees.some((item) => item.id === "ci-saree"));
});
