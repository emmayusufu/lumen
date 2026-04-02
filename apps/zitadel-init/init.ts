import { createPrivateKey, createSign } from "crypto";
import { readFileSync } from "fs";
import { request as httpRequest } from "http";
import { URL } from "url";

const ZITADEL_URL = process.env.ZITADEL_URL ?? "http://zitadel:8080";
const MACHINE_KEY_PATH = process.env.MACHINE_KEY_PATH ?? "/machinekey/zitadel-admin-sa.json";
const ZITADEL_DOMAIN = process.env.ZITADEL_DOMAIN ?? "localhost";
const ZITADEL_PORT = process.env.ZITADEL_PORT ?? "8080";
const ZITADEL_HOST_HEADER = ZITADEL_PORT === "80" ? ZITADEL_DOMAIN : `${ZITADEL_DOMAIN}:${ZITADEL_PORT}`;
const ZITADEL_ISSUER = `http://${ZITADEL_HOST_HEADER}`;
const NEXTAUTH_REDIRECT_URI =
  process.env.NEXTAUTH_REDIRECT_URI ?? "http://localhost:3000/api/auth/callback/zitadel";
const LOGIN_BASE_URI = new URL(NEXTAUTH_REDIRECT_URI).origin + "/auth";

interface FetchResponse {
  ok: boolean;
  status: number;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}

interface FetchOptions {
  method?: string;
  headers?: Record<string, string | number>;
  body?: string;
}

function httpFetch(urlStr: string, { method = "GET", headers = {}, body }: FetchOptions = {}): Promise<FetchResponse> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const opts = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method,
      headers: { Host: ZITADEL_HOST_HEADER, ...headers },
    };
    const req = httpRequest(opts, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString();
        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 0,
          text: () => Promise.resolve(text),
          json: () => Promise.resolve(JSON.parse(text)),
        });
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function waitForZitadel(): Promise<void> {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await httpFetch(`${ZITADEL_URL}/debug/healthz`);
      if (res.ok) return;
    } catch (err) {
      if (i % 5 === 0) console.log(`Waiting for Zitadel... (attempt ${i + 1}/30)`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Zitadel did not become healthy in time");
}

interface KeyData {
  keyId: string;
  userId: string;
  key: string;
}

function buildJwt(keyData: KeyData): string {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: keyData.keyId })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: keyData.userId,
      sub: keyData.userId,
      aud: ZITADEL_ISSUER,
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(createPrivateKey(keyData.key), "base64url");
  return `${header}.${payload}.${sig}`;
}

async function getAccessToken(keyData: KeyData): Promise<string> {
  const jwt = buildJwt(keyData);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    scope: `openid urn:zitadel:iam:org:domain:primary:${ZITADEL_DOMAIN} urn:zitadel:iam:permission:admin urn:zitadel:iam:org:project:id:zitadel:aud`,
    assertion: jwt,
  }).toString();
  const res = await httpFetch(`${ZITADEL_URL}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": Buffer.byteLength(body) },
    body,
  });
  const data = await res.json() as { access_token?: string };
  if (!data.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function makeRequest(token: string, method: string, path: string, body?: unknown): Promise<FetchResponse> {
  const bodyStr = body ? JSON.stringify(body) : undefined;
  return httpFetch(`${ZITADEL_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
    },
    body: bodyStr,
  });
}

async function api(token: string, method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await makeRequest(token, method, path, body);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiMaybeConflict(token: string, method: string, path: string, body?: unknown): Promise<unknown> {
  const res = await makeRequest(token, method, path, body);
  if (res.status === 409) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}


async function applyBranding(token: string): Promise<void> {
  // Apply teal colour scheme + Nunito font matching the web app theme.
  // Logo upload requires gRPC streaming (not available via REST in v4); set it
  // manually in the Zitadel console or serve /logo.svg from the web app.
  await api(token, "PUT", "/admin/v1/policies/label", {
    primaryColor: "#0d9488",
    backgroundColor: "#f8fafb",
    warnColor: "#f43f5e",
    fontColor: "#0f172a",
    primaryColorDark: "#2dd4bf",
    backgroundColorDark: "#0b1120",
    warnColorDark: "#f43f5e",
    fontColorDark: "#e2e8f0",
    themeMode: "THEME_MODE_AUTO",
    fontUrl: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&display=swap",
    disableWatermark: true,
    hideLoginNameSuffix: false,
    errorMsgPopup: false,
    disableEmailVerifyButton: false,
  });
  await api(token, "POST", "/admin/v1/policies/label/_activate");
  console.log("Branding applied");
}

async function setupLoginClient(token: string): Promise<void> {
  const user = await apiMaybeConflict(token, "POST", "/management/v1/users/machine", {
    userName: "login-client",
    name: "Login Client",
  }) as { userId: string } | null;

  let userId: string;
  if (user) {
    userId = user.userId;
  } else {
    const search = await api(token, "POST", "/management/v1/users/_search", {
      queries: [{ userNameQuery: { userName: "login-client", method: "TEXT_QUERY_METHOD_EQUALS" } }],
    }) as { result?: { userId: string }[] };
    userId = search.result?.[0]?.userId
      ?? (() => { throw new Error("login-client user not found after conflict"); })();
  }

  await apiMaybeConflict(token, "POST", "/admin/v1/members", {
    userId,
    roles: ["IAM_LOGIN_CLIENT"],
  });

  const patRes = await makeRequest(token, "POST", `/v2/users/${userId}/pats`);
  const patData = await patRes.json() as { token?: string };
  if (patRes.ok && patData.token) {
    console.log("\n=== Login Client ===");
    console.log(`ZITADEL_LOGIN_CLIENT_TOKEN=${patData.token}`);
    console.log("Add to .env");
  } else {
    console.log("Login client already configured — manage PATs via Zitadel console if needed");
  }
}

async function main(): Promise<void> {
  await waitForZitadel();
  const keyData: KeyData = JSON.parse(readFileSync(MACHINE_KEY_PATH, "utf8"));
  const token = await getAccessToken(keyData);

  await applyBranding(token);
  await setupLoginClient(token);

  const githubId = process.env.GITHUB_CLIENT_ID;
  const githubSecret = process.env.GITHUB_CLIENT_SECRET;
  if (githubId && githubSecret) {
    const created = await apiMaybeConflict(token, "POST", "/admin/v1/idps/github", {
      name: "GitHub",
      clientId: githubId,
      clientSecret: githubSecret,
      scopes: ["user:email", "read:user"],
    });
    console.log(created ? "GitHub IdP configured" : "GitHub IdP already exists");
  }

  const googleId = process.env.GOOGLE_CLIENT_ID;
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (googleId && googleSecret) {
    const created = await apiMaybeConflict(token, "POST", "/admin/v1/idps/google", {
      name: "Google",
      clientId: googleId,
      clientSecret: googleSecret,
      scopes: ["openid", "email", "profile"],
    });
    console.log(created ? "Google IdP configured" : "Google IdP already exists");
  }

  let project = await apiMaybeConflict(token, "POST", "/management/v1/projects", {
    name: "Writing Platform",
    projectRoleAssertion: true,
  }) as { id: string } | null;
  if (!project) {
    const search = await api(token, "POST", "/management/v1/projects/_search", {
      queries: [{ nameQuery: { name: "Writing Platform", method: "TEXT_QUERY_METHOD_EQUALS" } }],
    }) as { result?: { id: string }[] };
    project = search.result?.[0] ?? (() => { throw new Error("Project not found after conflict"); })();
  }

  const oidcApp = await apiMaybeConflict(
    token,
    "POST",
    `/management/v1/projects/${project.id}/apps/oidc`,
    {
      name: "Web",
      redirectUris: [NEXTAUTH_REDIRECT_URI],
      loginBaseUri: LOGIN_BASE_URI,
      responseTypes: ["OIDC_RESPONSE_TYPE_CODE"],
      grantTypes: [
        "OIDC_GRANT_TYPE_AUTHORIZATION_CODE",
        "OIDC_GRANT_TYPE_REFRESH_TOKEN",
      ],
      appType: "OIDC_APP_TYPE_WEB",
      authMethodType: "OIDC_AUTH_METHOD_TYPE_BASIC",
      postLogoutRedirectUris: [new URL(NEXTAUTH_REDIRECT_URI).origin],
      accessTokenType: "OIDC_TOKEN_TYPE_JWT",
    }
  ) as { clientId: string; clientSecret: string } | null;

  try {
    await api(token, "PUT", "/admin/v1/settings/oidc", {
      accessTokenLifetime: "900s",
      idTokenLifetime: "3600s",
      refreshTokenIdleExpiration: "2592000s",
      refreshTokenExpiration: "2592000s",
    });
  } catch (err) {
    if (!(err instanceof Error) || !err.message.includes("400")) throw err;
  }

  if (!oidcApp) {
    const apps = await api(
      token,
      "GET",
      `/management/v1/projects/${project.id}/apps/_search`
    ) as { result?: { id: string; name: string }[] };
    const existing = apps.result?.find((a) => a.name === "Web");
    if (existing) {
      console.log("\n=== OIDC App (existing) ===");
      console.log(`App ID: ${existing.id}`);
      console.log("Client secret is not retrievable — check Zitadel console or regenerate.");
    }
  } else {
    console.log("\n=== OIDC App Created ===");
    console.log(`Client ID:     ${oidcApp.clientId}`);
    console.log(`Client Secret: ${oidcApp.clientSecret}`);
    console.log("\nAdd to .env:");
    console.log(`ZITADEL_CLIENT_ID=${oidcApp.clientId}`);
    console.log(`ZITADEL_CLIENT_SECRET=${oidcApp.clientSecret}`);
    console.log("\nToken lifetimes configured (access: 15m, refresh: 30d)");
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
