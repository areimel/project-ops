/** Joins the truthy class names with single spaces: cx("card", muted && "is-muted", className). */
export const cx = (...names: (string | false | null | undefined)[]): string => names.filter(Boolean).join(" ");
