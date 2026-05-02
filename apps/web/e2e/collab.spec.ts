import { expect, test } from "@playwright/test";
import { logIn, signUp, uniqueEmail } from "./helpers";

test("two users editing same doc see each other's changes via Yjs", async ({
  browser,
}) => {
  const ctxBob = await browser.newContext();
  const pageBob = await ctxBob.newPage();
  const bobEmail = uniqueEmail("bob");
  const { password: bobPassword } = await signUp(pageBob, {
    email: bobEmail,
    firstName: "Bob",
    lastName: "Ross",
  });
  await ctxBob.clearCookies();

  const ctxAlice = await browser.newContext();
  const pageAlice = await ctxAlice.newPage();
  await signUp(pageAlice, {
    firstName: "Alice",
    lastName: "Adams",
  });

  await pageAlice.getByPlaceholder("Untitled").fill("Collab doc");
  await pageAlice.getByPlaceholder("Untitled").blur();
  await expect(pageAlice.getByText("Saved")).toBeVisible({ timeout: 10000 });
  const docUrl = pageAlice.url();

  await pageAlice.getByRole("button", { name: /^share$/i }).click();
  await pageAlice.getByPlaceholder("colleague@company.com").fill(bobEmail);
  await pageAlice.getByRole("button", { name: /invite/i }).click();
  await expect(pageAlice.getByText("Bob Ross")).toBeVisible({ timeout: 5000 });
  await pageAlice.locator("body").click({ position: { x: 10, y: 10 } });

  await pageBob.goto("/login");
  await logIn(pageBob, bobEmail, bobPassword);
  await pageBob.goto(docUrl);

  const aliceEditor = pageAlice.locator(".ProseMirror").first();
  const bobEditor = pageBob.locator(".ProseMirror").first();
  await expect(aliceEditor).toBeVisible();
  await expect(bobEditor).toBeVisible();
  await pageAlice.waitForTimeout(500);
  await pageBob.waitForTimeout(500);

  await aliceEditor.click();
  await pageAlice.keyboard.type("hello from alice");
  await expect(bobEditor.getByText("hello from alice")).toBeVisible({
    timeout: 10000,
  });

  await bobEditor.click();
  await pageBob.keyboard.press("End");
  await pageBob.keyboard.type(" and bob too");
  await expect(aliceEditor.getByText("and bob too")).toBeVisible({
    timeout: 10000,
  });

  await ctxAlice.close();
  await ctxBob.close();
});
