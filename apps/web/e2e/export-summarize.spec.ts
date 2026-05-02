import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("export as Markdown downloads a .md file", async ({ page }) => {
  await signUp(page);
  await page.getByPlaceholder("Untitled").fill("Export Target");
  await page.getByPlaceholder("Untitled").blur();
  await page.locator(".ProseMirror").first().click();
  await page.keyboard.type("Hello world.");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

  await page.getByRole("button", { name: /more/i }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("menuitem", { name: /export as markdown/i }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/export-target\.md$/);
});

test("summarize streams tokens into the panel", async ({ page }) => {
  await page.route("**/api/v1/ai/summarize/**", async (route) => {
    const body =
      'event: token\ndata: {"text":"Hello "}\n\n' +
      'event: token\ndata: {"text":"from "}\n\n' +
      'event: token\ndata: {"text":"stub."}\n\n' +
      "event: done\ndata: {}\n\n";
    await route.fulfill({
      status: 200,
      headers: {
        "content-type": "text/event-stream",
        "cache-control": "no-cache",
      },
      body,
    });
  });

  await signUp(page);
  await page.getByPlaceholder("Untitled").fill("Summary me");
  await page.getByPlaceholder("Untitled").blur();
  await page.locator(".ProseMirror").first().click();
  await page.keyboard.type("Lorem ipsum, meaningful content here.");
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 });

  await page.getByRole("button", { name: /more/i }).click();
  await page.getByRole("menuitem", { name: /summarize doc/i }).click();

  await expect(page.getByText("Summary", { exact: true })).toBeVisible();
  await expect(page.getByText(/Hello from stub\./)).toBeVisible({
    timeout: 5000,
  });
});
