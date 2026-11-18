import { consentField, formSettings, forms } from "../config/forms";

for (const form of document.querySelectorAll<HTMLFormElement>("[data-contact-form]")) {
  const status = form.querySelector<HTMLElement>("[data-form-status]");
  const button = form.querySelector<HTMLButtonElement>("button[type=submit]");
  if (!status || !button) continue;

  const kind = form.dataset.formKind === "signup" ? "signup" : "inquiry";
  const idleLabel = button.textContent;
  let pending = false;

  function announce(message: string, state: string) {
    status!.textContent = message;
    status!.dataset.state = state;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending) return;
    if (form.dataset.configured !== "true") {
      announce(forms.status.unconfigured, "error");
      return;
    }
    if (!form.reportValidity()) return;

    const values = Object.fromEntries(new FormData(form));
    if (values.botcheck) return;
    if (kind !== "signup") delete values[consentField];
    pending = true;
    button.disabled = true;
    button.textContent = forms.status.sendingButton;
    form.setAttribute("aria-busy", "true");
    announce(forms.status.sending, "pending");
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), formSettings.timeoutMs);

    try {
      const response = await fetch(formSettings.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });
      const result: unknown = await response.json();
      if (!response.ok || !result || typeof result !== "object" || !("success" in result) || result.success !== true) {
        throw new Error("Submission rejected");
      }
      form.reset();
      announce(forms[kind].success, "success");
    } catch {
      announce(controller.signal.aborted ? forms.status.timeout : forms.status.error, "error");
    } finally {
      window.clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      button.textContent = idleLabel;
      form.removeAttribute("aria-busy");
    }
  });
}
