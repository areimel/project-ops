import { expect, type Locator, type Page } from "@playwright/test";
import { deployDefaults } from "../src/config/deploy.ts";
import { product, debFileName } from "../src/config/product.ts";
import { forms, formSettings, consentField } from "../src/config/forms.ts";
import { home } from "../src/config/pages/home.ts";
import { notFound } from "../src/config/pages/notFound.ts";
import { demos } from "../src/config/content.ts";

export { product, debFileName, forms, formSettings, consentField, home, notFound, demos };

/** Mirrors `navigation` in src/config/site.ts, which cannot be imported under Node (import.meta.env). */
export const navigation = [
  { label: "Home", path: "" },
  { label: "Download", path: "download/" },
  { label: "Docs", path: "docs/" },
  { label: "Contact", path: "contact/" },
];

/** Label of the theme toggle's accessible name prefix (see ThemeToggle.astro). */
export const themeToggleName = /^Switch to (dark|light) theme$/;

const rawBase = process.env.SITE_BASE || deployDefaults.siteBase;
/** Hosting base with a leading and a trailing slash, e.g. "/name/". */
export const base = `/${rawBase.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
export const origin = (process.env.SITE_URL || deployDefaults.siteUrl).replace(/\/+$/, "");
export const installCommand = `curl -fsSL ${origin}${base}install.sh | bash`;
export const unconfigured = process.env.TEST_FORMS_UNCONFIGURED === "1";
export const testAccessKey = "test-access-key";

export async function fillSignup(page: Page): Promise<Locator> {
  await page.goto("contact/");
  const form = page.locator('[data-form-kind="signup"]');
  await form.getByLabel(forms.signup.emailLabel).fill("viewer@example.com");
  await form.getByRole("checkbox").check();
  return form;
}

export async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}
