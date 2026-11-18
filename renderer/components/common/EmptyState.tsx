import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

/** What a screen shows when there is nothing yet: say what is missing and offer the first action. */
export function EmptyState({ icon, title, body, action }: { icon?: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state-icon"><Icon name={icon} size={28} /></span>}
      <h2 className="empty-state-title">{title}</h2>
      {body && <p className="empty-state-body">{body}</p>}
      {action}
    </div>
  );
}
