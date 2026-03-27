import { test, expect } from "@playwright/test";

const TEST_EMAIL = "rybarrett11@gmail.com";
const TEST_PASSWORD = "password";

test.describe("Authentication flow", () => {
  test("login page renders correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("text=Sign in to Anchor")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
    await expect(page.locator("text=Register")).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill("nonexistent@anchor.app");
    await page.locator("#password").fill("WrongPassword999");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText(/invalid email or password/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.locator("#email").fill(TEST_EMAIL);
    await page.locator("#password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });

    await expect(
      page.locator("text=Dashboard").first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("protected route redirects unauthenticated user to login", async ({
    page,
  }) => {
    await page.goto("/physical-state");

    await expect(page).toHaveURL(/\/login/);
  });
});
