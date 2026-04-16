import { test, expect } from "@playwright/test";

const TEST_EMAIL = "rybarrett11@gmail.com";
const TEST_PASSWORD = "password";

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.locator("#email").fill(TEST_EMAIL);
  await page.locator("#password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

test.describe("Authenticated navigation & features", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard loads with calendar and sidebar navigation", async ({
    page,
  }) => {
    await expect(page.locator("text=Dashboard").first()).toBeVisible();
  });

  test("navigate to Physical State page", async ({ page }) => {
    await page.getByRole("link", { name: /physical state/i }).first().click();

    await expect(page).toHaveURL(/\/physical-state/);
    await expect(page.locator("text=Physical State").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Recovery" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Training" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Fueling" })).toBeVisible();
  });

  test("navigate to Psychological State page", async ({ page }) => {
    await page
      .getByRole("link", { name: /psychological state/i })
      .first()
      .click();

    await expect(page).toHaveURL(/\/psychological-state/);
  });

  test("navigate to Assessments page", async ({ page }) => {
    await page.getByRole("link", { name: /assessments/i }).first().click();

    await expect(page).toHaveURL(/\/assessments/);
    await expect(page.locator("text=Assessments").first()).toBeVisible();
  });

  test("navigate to Sessions page", async ({ page }) => {
    await page.getByRole("link", { name: /sessions/i }).first().click();

    await expect(page).toHaveURL(/\/sessions/);
  });

  test("Physical State tab switching works", async ({ page }) => {
    await page.goto("/physical-state");
    await expect(page.getByRole("button", { name: "Recovery" })).toBeVisible();

    await page.getByRole("button", { name: "Training" }).click();
    await expect(page.getByText("Recent Workouts")).toBeVisible();

    await page.getByRole("button", { name: "Fueling" }).click();
    await expect(page.getByText("Recent Meals")).toBeVisible();

    await page.getByRole("button", { name: "Recovery" }).click();
    await expect(page.getByText("Recent Recovery")).toBeVisible();
  });
});
