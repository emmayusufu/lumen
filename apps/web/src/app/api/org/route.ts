import { NextRequest, NextResponse } from "next/server";
import { createPrivateKey, createSign } from "crypto";

const ZITADEL_ISSUER = process.env.ZITADEL_ISSUER!;

async function getMachineToken(): Promise<string> {
  const keyData = JSON.parse(process.env.ZITADEL_MACHINE_KEY!);
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
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch(`${ZITADEL_ISSUER}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      scope: "openid urn:zitadel:iam:permission:admin",
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(`Machine token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { orgName, firstName, lastName, email, password } = await req.json();
    const token = await getMachineToken();

    const res = await fetch(`${ZITADEL_ISSUER}/admin/v1/orgs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: orgName,
        human: {
          userName: email,
          profile: { firstName, lastName },
          email: { email, isEmailVerified: false },
          password: { password, changeRequired: false },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.message ?? "Failed to create organization" },
        { status: 400 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
