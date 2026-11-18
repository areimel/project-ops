import { expect, test } from "@playwright/test";
import { consentField, fillSignup, forms, formSettings, testAccessKey, unconfigured } from "./helpers.ts";

const endpoint = formSettings.endpoint;

test.describe("configured Web3Forms", () => {
  test.skip(unconfigured, "Requires a build with the test access key");

  test("signup requires consent before making a request", async ({ page }) => {
    let requests = 0;
    await page.route(endpoint, async (route) => {
      requests++;
      await route.fulfill({ json: { success: true } });
    });
    await page.goto("contact/");
    const form = page.locator('[data-form-kind="signup"]');
    await form.getByLabel(forms.signup.emailLabel).fill("viewer@example.com");
    await form.getByRole("button").click();
    expect(await form.evaluate((node: HTMLFormElement) => node.checkValidity())).toBe(false);
    expect(requests).toBe(0);
  });

  test("signup confirms only an accepted submission and records consent", async ({ page }) => {
    let payload: Record<string, unknown> = {};
    await page.route(endpoint, async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { success: true } });
    });
    const form = await fillSignup(page);
    await form.getByRole("button").click();
    await expect(form.getByRole("status")).toContainText(forms.signup.success);
    expect(payload.email).toBe("viewer@example.com");
    expect(payload.subject).toBe(formSettings.signupSubject);
    expect(payload[consentField]).toBeTruthy();
    expect(payload.access_key).toBe(testAccessKey);
    await expect(form.getByLabel(forms.signup.emailLabel)).toHaveValue("");
  });

  test("inquiry succeeds without subscribing the sender", async ({ page }) => {
    let payload: Record<string, unknown> = {};
    await page.route(endpoint, async (route) => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { success: true } });
    });
    await page.goto("contact/");
    const form = page.locator('[data-form-kind="inquiry"]');
    await form.getByLabel(forms.inquiry.nameLabel).fill("A viewer");
    await form.getByLabel(forms.inquiry.emailLabel).fill("viewer@example.com");
    await form.getByLabel(forms.inquiry.messageLabel).fill("Can I remove a demo?");
    await form.getByRole("button").click();
    await expect(form.getByRole("status")).toContainText(forms.inquiry.success);
    expect(payload.subject).toBe(formSettings.inquirySubject);
    expect(payload.message).toBe("Can I remove a demo?");
    expect(payload).not.toHaveProperty(consentField);
  });

  for (const scenario of [
    { name: "service rejection", status: 200, body: { success: false } },
    { name: "HTTP failure", status: 500, body: { success: true } },
  ]) {
    test(`${scenario.name} preserves inputs and permits retry`, async ({ page }) => {
      await page.route(endpoint, (route) => route.fulfill({ status: scenario.status, json: scenario.body }));
      const form = await fillSignup(page);
      await form.getByRole("button").click();
      await expect(form.getByRole("status")).toContainText(forms.status.error);
      await expect(form.getByLabel(forms.signup.emailLabel)).toHaveValue("viewer@example.com");
      await expect(form.getByRole("checkbox")).toBeChecked();
      await expect(form.getByRole("button")).toBeEnabled();
    });
  }

  test("network failure preserves inputs", async ({ page }) => {
    await page.route(endpoint, (route) => route.abort());
    const form = await fillSignup(page);
    await form.getByRole("button").click();
    await expect(form.getByRole("status")).toContainText(forms.status.error);
    await expect(form.getByLabel(forms.signup.emailLabel)).toHaveValue("viewer@example.com");
  });

  test("malformed service responses preserve inputs", async ({ page }) => {
    await page.route(endpoint, (route) => route.fulfill({
      status: 200, contentType: "application/json", body: "not valid JSON",
    }));
    const form = await fillSignup(page);
    await form.getByRole("button").click();
    await expect(form.getByRole("status")).toContainText(forms.status.error);
    await expect(form.getByLabel(forms.signup.emailLabel)).toHaveValue("viewer@example.com");
    await expect(form.getByRole("button")).toBeEnabled();
  });

  test("a stalled request times out without clearing the form", async ({ page }) => {
    await page.clock.install();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route(endpoint, async (route) => {
      await gate;
      await route.abort();
    });
    const form = await fillSignup(page);
    await form.getByRole("button").click();
    await expect(form.getByRole("button")).toBeDisabled();
    await page.clock.fastForward(formSettings.timeoutMs + 1);
    await expect(form.getByRole("status")).toContainText(forms.status.timeout);
    await expect(form.getByLabel(forms.signup.emailLabel)).toHaveValue("viewer@example.com");
    await expect(form.getByRole("button")).toBeEnabled();
    release();
  });

  test("pending submissions cannot be sent twice", async ({ page }) => {
    let requests = 0;
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    await page.route(endpoint, async (route) => {
      requests++;
      await gate;
      await route.fulfill({ json: { success: true } });
    });
    const form = await fillSignup(page);
    await form.getByRole("button").click();
    await expect(form.getByRole("button")).toBeDisabled();
    await form.evaluate((node: HTMLFormElement) => node.requestSubmit());
    await expect.poll(() => requests).toBe(1);
    release();
    await expect(form.getByRole("status")).toContainText(forms.signup.success);
    expect(requests).toBe(1);
  });
});

test("missing key visibly disables both forms without sending requests", async ({ page }) => {
  test.skip(!unconfigured, "Requires a build without a Web3Forms key");
  let requests = 0;
  await page.route(endpoint, async (route) => {
    requests++;
    await route.abort();
  });
  await page.goto("contact/");
  const forms_ = page.locator("[data-contact-form]");
  await expect(forms_).toHaveCount(2);
  for (const form of await forms_.all()) {
    await expect(form.getByRole("button")).toBeDisabled();
    await expect(form.getByRole("status")).toContainText(forms.status.unconfigured);
    await form.evaluate((node: HTMLFormElement) => node.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  }
  expect(requests).toBe(0);
});
