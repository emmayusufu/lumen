import { expect, test } from "@playwright/test";
import { logIn, signUp, uniqueEmail } from "./helpers";

test("sign up lands on dashboard", async ({ page }) => {
  await signUp(page);
  await expect(page).toHaveURL(/\/w\/[a-z0-9-]+\/docs/);
});

test("log out then log back in", async ({ page, context }) => {
  const { email, password } = await signUp(page);

  await context.clearCookies();
  await page.goto("/login");
  await logIn(page, email, password);
});

test("login with wrong password shows error", async ({ page }) => {
  const email = uniqueEmail();
  await signUp(page, { email });

  await page.context().clearCookies();
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid credentials/i)).toBeVisible();
});
