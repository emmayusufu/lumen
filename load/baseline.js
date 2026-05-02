import http from "k6/http";
import { check, sleep } from "k6";
import { authHeaders, BASE_URL, signUp } from "./helpers.js";

export const options = {
  scenarios: {
    baseline: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "30s", target: 20 },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    "http_req_failed{expected_response:true}": ["rate<0.01"],
    "http_req_duration{name:signup}": ["p(95)<1500"],
    "http_req_duration{name:list_docs}": ["p(95)<500"],
  },
};

export default function () {
  const { token } = signUp();
  sleep(0.2);

  const res = http.get(`${BASE_URL}/api/v1/content/docs`, {
    headers: authHeaders(token),
    tags: { name: "list_docs" },
  });
  check(res, { "list docs 200": (r) => r.status === 200 });

  sleep(Math.random() * 0.5);
}
