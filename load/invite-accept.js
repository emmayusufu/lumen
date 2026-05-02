import http from "k6/http";
import { check } from "k6";
import { authHeaders, BASE_URL, signUp } from "./helpers.js";

export const options = {
  scenarios: {
    accepts: {
      executor: "per-vu-iterations",
      vus: 10,
      iterations: 20,
      maxDuration: "90s",
    },
  },
  thresholds: {
    "http_req_failed{expected_response:true}": ["rate<0.01"],
    "http_req_duration{name:accept_invite}": ["p(95)<2500"],
  },
};

export function setup() {
  const email = `owner-${Date.now()}@inv-load.test`;
  const { token, workspaceSlug } = signUp(email, "InviteLoadOrg");
  const invites = [];
  for (let i = 0; i < 200; i++) {
    const r = http.post(
      `${BASE_URL}/api/v1/w/${workspaceSlug}/invites`,
      JSON.stringify({ role: "editor" }),
      { headers: authHeaders(token) },
    );
    invites.push(r.json("token"));
  }
  return { invites };
}

export default function (data) {
  const idx = (__VU - 1) * 20 + __ITER;
  const token = data.invites[idx];
  if (!token) return;
  const email = `invitee-${__VU}-${__ITER}-${Date.now()}@load.test`;
  const res = http.post(
    `${BASE_URL}/api/v1/invites/${token}/signup`,
    JSON.stringify({
      firstName: "Inv",
      lastName: `${__VU}`,
      email,
      password: "password123",
    }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "accept_invite" },
    },
  );
  check(res, { "accept 201": (r) => r.status === 201 });
}
