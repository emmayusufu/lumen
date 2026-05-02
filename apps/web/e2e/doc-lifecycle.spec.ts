import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("create doc, edit title + body, reload, content persists", async ({
  page,
}) => {
  await signUp(page);
  await expect(page).toHaveURL(/\/w\/[a-z0-9-]+\/docs\/[0-9a-f-]{36}/);
  const docUrl = page.url();

  await page.getByPlaceholder("Untitled").fill("Architecture notes");
  await page.getByPlaceholder("Untitled").blur();

  const editor = page.locator(".ProseMirror").first();
  await editor.click();
  await page.keyboard.type("Service A talks to service B over gRPC.");

  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

  await page.reload();
  await expect(page).toHaveURL(docUrl);
  await expect(page.getByPlaceholder("Untitled")).toHaveValue(
    "Architecture notes",
  );
  await expect(
    page
      .locator(".ProseMirror")
      .getByText("Service A talks to service B over gRPC."),
  ).toBeVisible();
});

test("second doc appears in sidebar", async ({ page }) => {
  await signUp(page);
  await expect(page).toHaveURL(/\/w\/[a-z0-9-]+\/docs\/[0-9a-f-]{36}/);

  await page.getByPlaceholder("Untitled").fill("First doc");
  await page.getByPlaceholder("Untitled").blur();
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

  await page
    .getByRole("button", { name: /new page/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/w\/[a-z0-9-]+\/docs\/[0-9a-f-]{36}/);
  await page.getByPlaceholder("Untitled").fill("Second doc");
  await page.getByPlaceholder("Untitled").blur();
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

  await expect(page.getByText("First doc").first()).toBeVisible();
  await expect(page.getByText("Second doc").first()).toBeVisible();
});
