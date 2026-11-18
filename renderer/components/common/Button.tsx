import type { ButtonHTMLAttributes } from "react";
import { Icon, type IconName } from "./Icon";

export type ButtonVariant = "primary" | "quiet" | "link" | "danger";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: IconName;
}

export function Button({ variant = "primary", icon, className = "", type = "button", children, ...rest }: Props) {
  return (
    <button type={type} className={`btn btn-${variant} ${className}`.trim()} {...rest}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}
