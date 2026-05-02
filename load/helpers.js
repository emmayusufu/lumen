import http from "k6/http";
import { check } from "k6";

export const BASE_URL = __ENV.LUMEN_URL || "http://localhost:8742";

export function uniqueEmail(prefix = "load") {
  const n = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${__VU}-${__ITER}-${n}@load.test`;
}

export function signUp(email = uniqueEmail(), workspace = "LoadOrg") {
  const res = http.post(
    `${BASE_URL}/api/v1/auth/signup`,
    JSON.stringify({
      workspaceName: workspace,
      firstName: "Load",
      lastName: "User",
      email,
      password: "password123",
    }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(res, { "signup 201": (r) => r.status === 201 });
  const cookie = res.headers["Set-Cookie"] || "";
  const token = (cookie.match(/token=([^;]+)/) || [])[1];
  const body = res.json();
  return {
    email,
    token,
    userId: body.id,
    workspaceSlug: body.workspace && body.workspace.slug,
  };
}

export function authHeaders(token) {
  return { Cookie: `token=${token}`, "Content-Type": "application/json" };
}

export function createDoc(token, workspaceSlug, title = "Load doc") {
  const body = workspaceSlug
    ? { title, workspace_slug: workspaceSlug }
    : { title };
  const res = http.post(
    `${BASE_URL}/api/v1/content/docs`,
    JSON.stringify(body),
    { headers: authHeaders(token) },
  );
  check(res, { "create doc 201": (r) => r.status === 201 });
  return res.json("id");
}
