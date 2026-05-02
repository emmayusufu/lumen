import { expect, test } from "@playwright/test";
import { logIn, signUp, uniqueEmail } from "./helpers";

test("owner shares doc with editor, editor sees it in sidebar", async ({
  browser,
}) => {
  const ctxBob = await browser.newContext();
  const pageBob = await ctxBob.newPage();
  const bobEmail = uniqueEmail("bob");
  const { password: bobPassword } = await signUp(pageBob, {
    email: bobEmail,
    firstName: "Bob",
    lastName: "Jones",
  });
  await ctxBob.clearCookies();

  const ctxAlice = await browser.newContext();
  const pageAlice = await ctxAlice.newPage();
  await signUp(pageAlice, {
    firstName: "Alice",
    lastName: "Adams",
  });

  await pageAlice.getByPlaceholder("Untitled").fill("Shared launch plan");
  await pageAlice.getByPlaceholder("Untitled").blur();
  await expect(pageAlice.getByText("Saved")).toBeVisible({ timeout: 10000 });
  const docUrl = pageAlice.url();

  await pageAlice.getByRole("button", { name: /^share$/i }).click();
  await pageAlice.getByPlaceholder("colleague@company.com").fill(bobEmail);
  await pageAlice.getByRole("button", { name: /invite/i }).click();
  await expect(pageAlice.getByText("Bob Jones")).toBeVisible({ timeout: 5000 });

  await pageBob.goto("/login");
  await logIn(pageBob, bobEmail, bobPassword);
  await pageBob.goto(docUrl);

  await expect(pageBob.getByPlaceholder("Untitled")).toHaveValue(
    "Shared launch plan",
  );

  await ctxAlice.close();
  await ctxBob.close();
});

test("outsider in different org gets redirected away from private doc", async ({
  browser,
}) => {
  const ctxAlice = await browser.newContext();
  const pageAlice = await ctxAlice.newPage();
  await signUp(pageAlice);
  await pageAlice.getByPlaceholder("Untitled").fill("Acme secret");
  await pageAlice.getByPlaceholder("Untitled").blur();
  await expect(pageAlice.getByText("Saved")).toBeVisible({ timeout: 10000 });
  const docUrl = pageAlice.url();

  const ctxBob = await browser.newContext();
  const pageBob = await ctxBob.newPage();
  await signUp(pageBob);

  const docId = docUrl.split("/docs/")[1];
  const resp = await pageBob.request.get(
    `http://localhost:3847/api/backend/api/v1/content/docs/${docId}`,
  );
  expect(resp.status()).toBe(403);

  await ctxAlice.close();
  await ctxBob.close();
});
