import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { authHeaders, BASE_URL, signUp } from "./helpers.js";

const rate403 = new Counter("rate_403");
const rate429 = new Counter("rate_429");
const rateOther = new Counter("rate_other");

export const options = {
  scenarios: {
    hammer: {
      executor: "per-vu-iterations",
      vus: 1,
      iterations: 50,
      maxDuration: "45s",
    },
  },
  thresholds: {
    rate_429: ["count>10"],
    "http_req_duration{name:summarize}": ["p(95)<500"],
  },
};

export function setup() {
  const email = `ratelimit-${Date.now()}@load.test`;
  const { token } = signUp(email, "RateLimitOrg");
  return { token };
}

export default function (data) {
  const fakeId = "00000000-0000-0000-0000-000000000000";
  const res = http.get(`${BASE_URL}/api/v1/ai/summarize/${fakeId}`, {
    headers: authHeaders(data.token),
    tags: { name: "summarize" },
    responseType: "text",
  });
  if (res.status === 403) rate403.add(1);
  else if (res.status === 429) rate429.add(1);
  else rateOther.add(1);

  check(res, {
    "no 5xx": (r) => r.status < 500,
    "expected status": (r) => r.status === 403 || r.status === 429,
  });
}
