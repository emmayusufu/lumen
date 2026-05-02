import { expect, type Page } from "@playwright/test";
import { randomBytes } from "node:crypto";

export const uniqueEmail = (prefix = "user") =>
  `${prefix}-${randomBytes(4).toString("hex")}@e2e.test`;

export async function signUp(
  page: Page,
  opts: {
    email?: string;
    password?: string;
    workspace?: string;
    firstName?: string;
    lastName?: string;
  } = {},
): Promise<{ email: string; password: string; workspaceSlug: string }> {
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? "password123";
  const workspace = opts.workspace ?? "Acme";
  const firstName = opts.firstName ?? "Test";
  const lastName = opts.lastName ?? "User";

  await page.goto("/signup");
  await page.getByPlaceholder("Acme Corp", { exact: true }).fill(workspace);
  await page.getByPlaceholder("Alice", { exact: true }).fill(firstName);
  await page.getByPlaceholder("Smith", { exact: true }).fill(lastName);
  await page
    .getByPlaceholder("alice@acmecorp.com", { exact: true })
    .fill(email);
  await page
    .getByPlaceholder("Min. 8 characters", { exact: true })
    .fill(password);
  await page.getByRole("button", { name: /create workspace/i }).click();

  await expect(page).toHaveURL(/\/w\/[a-z0-9-]+\/docs/);
  const slugMatch = page.url().match(/\/w\/([a-z0-9-]+)\//);
  return { email, password, workspaceSlug: slugMatch![1] };
}

export async function logIn(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/w\/[a-z0-9-]+\/docs/);
}
