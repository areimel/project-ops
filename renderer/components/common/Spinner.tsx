export function Spinner({ label }: { label: string }) {
  return <span className="spinner" role="status" aria-label={label}><span className="visually-hidden">{label}</span></span>;
}
