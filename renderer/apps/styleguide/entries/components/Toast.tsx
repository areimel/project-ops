import { ToastHost, type ToastItem } from "../../../../components/common/Toast";
import type { CatalogueEntry } from "../../types";

const undo = { label: "Undo", run: () => undefined };

export const entry = {
  id: "toast",
  title: "Toast",
  family: "feedback",
  source: "renderer/components/common/Toast.tsx",
  exports: ["ToastHost", "useToasts", "ToastKind", "ToastAction", "ToastItem"],
  purpose: "A short message that reports what an action did, with a coloured edge for its kind. A toast with an action such as Undo stays until it is used or dismissed; one without an action goes after four seconds.",
  useFor: [
    "Confirming a finished command: Data exported, Data reset, Copied.",
    "Reporting a failed command in words the owner can act on, as kind error (the message is announced at once).",
    "An undo for a removal: Removed <project> with Undo, which restores it.",
  ],
  notFor: [
    "A question that needs an answer before the work goes on: use the shell's confirm dialog (useShell().confirm).",
    "The state of an object such as a project's status: use StatusDot.",
    "A message inside a form or next to a field: use the field's hint or error text.",
  ],
  snippet: "toast(\"success\", \"Data exported\");\ntoast(\"info\", \"Removed demo-site\", { label: \"Undo\", run: restore });\ntoast(\"error\", \"Could not copy the snippet\");",
  specimens: [
    {
      label: "Success", width: 360,
      render: () => <ToastHost inline items={[{ id: 1, kind: "success", message: "Data exported" }]} onDismiss={() => {}} />,
    },
    {
      label: "Error (announced at once)", width: 360,
      render: () => <ToastHost inline items={[{ id: 2, kind: "error", message: "Could not copy the snippet" }]} onDismiss={() => {}} />,
    },
    {
      label: "Info with Undo", width: 360,
      render: () => (
        <ToastHost inline items={[{ id: 3, kind: "info", message: "Removed client-portal", action: undo }]} onDismiss={() => {}} />
      ),
    },
    {
      label: "Several stacked", wide: true,
      render: () => {
        const items: ToastItem[] = [
          { id: 4, kind: "info", message: "Removed old-site", action: undo },
          { id: 5, kind: "success", message: "Data imported: projects, project-roots" },
          { id: 6, kind: "error", message: "Folder is not readable: ~/code_projects/locked" },
        ];
        return <ToastHost inline items={items} onDismiss={() => {}} />;
      },
    },
  ],
  notes: [
    "Screens never render ToastHost. They call useShell().toast(kind, message, action?); AppShell owns the one host, fixed to the bottom right corner. The inline host here is only for this sheet.",
    "Toasts without an action dismiss after four seconds. A toast with an action stays until its button is used or its Dismiss is pressed, and at most four are kept.",
    "Copy: a short sentence in sentence case, naming the thing: Data imported: projects, project-roots; Removed <name>. A failed action passes its error message through (useAttempt).",
    "The toast host and useToasts are the shell's (AppShell); the styleguide does not call useToasts because a hook cannot run in a specimen.",
  ],
} satisfies CatalogueEntry;
