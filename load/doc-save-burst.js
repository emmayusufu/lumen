import http from "k6/http";
import { check, sleep } from "k6";
import { authHeaders, BASE_URL, createDoc, signUp } from "./helpers.js";

export const options = {
  scenarios: {
    writes: {
      executor: "constant-vus",
      vus: 15,
      duration: "30s",
    },
  },
  thresholds: {
    "http_req_failed{name:patch_doc}": ["rate<0.02"],
    "http_req_duration{name:patch_doc}": ["p(95)<600", "p(99)<1500"],
  },
};

export function setup() {
  const email = `owner-${Date.now()}@load.test`;
  const { token, workspaceSlug } = signUp(email, "WriteBurstOrg");
  const docId = createDoc(token, workspaceSlug, "Shared write target");
  return { token, docId };
}

export default function (data) {
  const content = `<p>VU ${__VU} iter ${__ITER} @ ${Date.now()}</p>`;
  const res = http.patch(
    `${BASE_URL}/api/v1/content/docs/${data.docId}`,
    JSON.stringify({ content }),
    { headers: authHeaders(data.token), tags: { name: "patch_doc" } },
  );
  check(res, { "patch doc 204": (r) => r.status === 204 });
  sleep(Math.random() * 0.2);
}
