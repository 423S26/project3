import { test, expect } from "@playwright/test";

test.describe("Landing page (public)", () => {
  test("renders hero section and feature cards", async ({ page }) => {
    await page.goto("/landing");

    await expect(page).toHaveTitle(/Anchor/);

    await expect(page.locator("text=Sign In")).toBeVisible();
    await expect(page.locator("text=Register").first()).toBeVisible();
  });

  test("sign-in link navigates to login page", async ({ page }) => {
    await page.goto("/landing");

    await page.getByRole("link", { name: /sign in/i }).first().click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("text=Sign in to Anchor")).toBeVisible();
  });

  test("unauthenticated root redirects to landing", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/landing/);
  });
});
