import http from "k6/http";
import { check } from "k6";
import { authHeaders, BASE_URL, createDoc, signUp } from "./helpers.js";

export const options = {
  scenarios: {
    reads: {
      executor: "constant-vus",
      vus: 20,
      duration: "20s",
    },
  },
  thresholds: {
    "http_req_duration{name:list_docs}": ["p(95)<200", "p(99)<500"],
    "http_req_duration{name:get_doc}": ["p(95)<200", "p(99)<500"],
  },
};

export function setup() {
  const email = `reader-${Date.now()}@load.test`;
  const { token, workspaceSlug } = signUp(email, "ReadPathOrg");
  const docId = createDoc(token, workspaceSlug, "Read target");
  return { token, docId };
}

export default function (data) {
  const r1 = http.get(`${BASE_URL}/api/v1/content/docs`, {
    headers: authHeaders(data.token),
    tags: { name: "list_docs" },
  });
  check(r1, { "list_docs 200": (r) => r.status === 200 });

  const r2 = http.get(`${BASE_URL}/api/v1/content/docs/${data.docId}`, {
    headers: authHeaders(data.token),
    tags: { name: "get_doc" },
  });
  check(r2, { "get_doc 200": (r) => r.status === 200 });
}
