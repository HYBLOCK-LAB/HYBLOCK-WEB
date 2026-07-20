export default function AuthDivider() {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-px flex-1 bg-monolith-outline-variant/30" />
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-on-surface-muted">or</span>
      <div className="h-px flex-1 bg-monolith-outline-variant/30" />
    </div>
  );
}
