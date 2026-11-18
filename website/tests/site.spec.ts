import { expect, test } from "@playwright/test";
import { base, home, installCommand, navigation, notFound, origin, product, expectNoOverflow } from "./helpers.ts";

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test.describe(`${viewport.width}px layout`, () => {
    test.use({ viewport });
    for (const route of navigation) {
      test(`${route.label} has a title, heading, navigation, and no overflow`, async ({ page }) => {
        const response = await page.goto(route.path || "./");
        expect(response?.status()).toBe(200);
        await expect(page).toHaveTitle(new RegExp(product.name));
        await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
        const nav = page.getByRole("navigation").first();
        for (const destination of navigation) {
          const link = nav.getByRole("link", { name: destination.label, exact: true });
          await expect(link).toBeVisible();
          expect(await link.getAttribute("href")).toBe(`${base}${destination.path}`);
        }
        await expectNoOverflow(page);
      });
    }
  });
}

test("navigation opens each route under the hosting base", async ({ page }) => {
  await page.goto("./");
  for (const destination of navigation.slice(1)) {
    await page.getByRole("navigation").first().getByRole("link", { name: destination.label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${base}${destination.path}$`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("download copies the install command", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("download/");
  await expect(page.locator("[data-command-block] code")).toHaveText(installCommand);
  await page.getByRole("button", { name: /copy/i }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(installCommand);
});

test("the install script is served beneath the hosting base", async ({ request }) => {
  const response = await request.get("install.sh");
  expect(response.status()).toBe(200);
  const body = await response.text();
  expect(body.startsWith("#!/usr/bin/env bash")).toBe(true);
  expect(body).toContain(`REPO="${product.repo}"`);
  expect(body.trimEnd().endsWith('main "$@"')).toBe(true);
});

test("home page carries SoftwareApplication structured data and a sitemap link", async ({ page }) => {
  await page.goto("./");
  const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  expect(data["@type"]).toBe("SoftwareApplication");
  expect(data.operatingSystem).toBe(product.operatingSystem);
  expect(await page.locator('link[rel="sitemap"]').getAttribute("href")).toBe(`${base}sitemap-index.xml`);
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(`${origin}${base}`);
});

test("keyboard skip link moves navigation into the page", async ({ page }) => {
  await page.goto("./");
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Skip to content" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  expect(await skip.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
  await page.keyboard.press("Tab");
  const cta = page.getByRole("main").getByRole("link", { name: home.hero.primaryCta });
  await expect(cta).toBeFocused();
  expect(await cta.getAttribute("href")).toBe(`${base}download/`);
});

test("reduced-motion preference disables smooth scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
});

test("images, scripts, and styles resolve beneath the hosting base", async ({ page, request }) => {
  const assets = new Set<string>();
  for (const route of navigation) {
    await page.goto(route.path || "./");
    const urls = await page.locator('img[src], script[src], link[rel="stylesheet"][href]').evaluateAll((nodes) =>
      nodes.map((node) => new URL(node.getAttribute("src") || node.getAttribute("href") || "", location.href).href),
    );
    for (const url of urls) assets.add(url);
  }
  expect([...assets].some((u) => u.endsWith(".css"))).toBe(true);
  expect([...assets].some((u) => /\.(svg|webp|png|jpe?g)$/.test(u))).toBe(true);
  for (const url of assets) {
    expect(new URL(url).pathname.startsWith(base), url).toBe(true);
    const response = await request.get(url);
    expect(response.status(), url).toBe(200);
    expect(response.headers()["content-type"], url).not.toContain("text/html");
  }
});

test("unknown routes provide a working home recovery link", async ({ page }) => {
  const response = await page.goto("not-a-page/");
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/404/);
  await expect(page).toHaveTitle(new RegExp(product.name));
  await page.getByRole("link", { name: new RegExp(notFound.homeLabel, "i") }).click();
  await expect(page).toHaveURL(new RegExp(`${base}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(home.hero.title);
});
