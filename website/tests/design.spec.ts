import { expect, test } from "@playwright/test";
import { demos, navigation, themeToggleName } from "./helpers.ts";

test("theme toggle switches data-theme and persists across reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: themeToggleName });
  await expect(toggle).toHaveAccessibleName(/dark/);
  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(toggle).toHaveAccessibleName(/light/);
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.goto("docs/");
  await expect(html).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: themeToggleName }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("dark colour scheme changes the page background", async ({ page }) => {
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("./");
  const light = await background();
  await page.emulateMedia({ colorScheme: "dark" });
  const dark = await background();
  expect(dark).not.toBe(light);
});

test.describe("title block", () => {
  navigation.forEach((route, index) => {
    test(`${route.label} shows its sheet number`, async ({ page }) => {
      await page.goto(route.path || "./");
      const footer = page.locator("footer");
      await expect(footer.locator("dt", { hasText: /^Sheet$/ })).toHaveCount(1);
      await expect(footer.getByText(`${index + 1} of ${navigation.length}`, { exact: true })).toBeVisible();
    });
  });

  test("the 404 page has no sheet cell", async ({ page }) => {
    await page.goto("not-a-page/");
    await expect(page.locator("footer dt", { hasText: /^Sheet$/ })).toHaveCount(0);
  });
});

test("the sheet index lists every demo in order", async ({ page }) => {
  await page.goto("./");
  const rows = page.locator("table.sheet-index tbody tr");
  await expect(rows).toHaveCount(demos.length);
  expect(demos).toHaveLength(8);
  for (const [i, demo] of demos.entries()) {
    const row = rows.nth(i);
    await expect(row.locator("th")).toHaveText(String(demo.number));
    await expect(row.locator("td").first()).toHaveText(demo.name);
  }
});

test("no text is transformed to upper case", async ({ page }) => {
  for (const route of navigation) {
    await page.goto(route.path || "./");
    const offenders = await page.evaluate(() =>
      [...document.querySelectorAll("header *, main *, footer *")]
        .filter((el) => getComputedStyle(el).textTransform === "uppercase")
        .map((el) => el.tagName.toLowerCase() + (el.className ? `.${el.className}` : "")),
    );
    expect(offenders, route.label).toEqual([]);
  }
});
