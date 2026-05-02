import { expect, test } from "@playwright/test";
import { signUp, uniqueEmail } from "./helpers";

test("admin mints invite, new user signs up via link, lands in workspace", async ({
  browser,
}) => {
  const ctxAlice = await browser.newContext();
  const pageAlice = await ctxAlice.newPage();
  const { workspaceSlug } = await signUp(pageAlice, { workspace: "Acme", firstName: "Alice" });

  await pageAlice.goto(`/w/${workspaceSlug}/settings/members`);
  await pageAlice.getByRole("button", { name: /^invite$/i }).click();
  await pageAlice.getByRole("button", { name: /create link/i }).click();

  const url = await pageAlice.locator("input[readonly]").inputValue();
  expect(url).toContain("/invite/");

  const ctxBob = await browser.newContext();
  const pageBob = await ctxBob.newPage();
  await pageBob.goto(url);

  await expect(pageBob.getByText(/to join "Acme"/)).toBeVisible();

  const bobEmail = uniqueEmail("bob");
  await pageBob.locator("input").nth(0).fill("Bob");
  await pageBob.locator("input").nth(1).fill("Ross");
  await pageBob.locator('input[type="email"]').fill(bobEmail);
  await pageBob.locator('input[type="password"]').fill("password123");
  await pageBob.getByRole("button", { name: /sign up and join/i }).click();

  await expect(pageBob).toHaveURL(new RegExp(`/w/${workspaceSlug}/docs`));

  await ctxAlice.close();
  await ctxBob.close();
});

test("revoked invite shows expired message", async ({ browser }) => {
  const ctxAlice = await browser.newContext();
  const pageAlice = await ctxAlice.newPage();
  const { workspaceSlug } = await signUp(pageAlice);

  await pageAlice.goto(`/w/${workspaceSlug}/settings/members`);
  await pageAlice.getByRole("button", { name: /^invite$/i }).click();
  await pageAlice.getByRole("button", { name: /create link/i }).click();
  const url = await pageAlice.locator("input[readonly]").inputValue();
  await pageAlice.getByRole("button", { name: /^close$/i }).click();

  await pageAlice.locator('[data-testid="revoke-invite"]').first().click();

  const ctxBob = await browser.newContext();
  const pageBob = await ctxBob.newPage();
  await pageBob.goto(url);

  await expect(pageBob.getByText(/expired/i)).toBeVisible();

  await ctxAlice.close();
  await ctxBob.close();
});
