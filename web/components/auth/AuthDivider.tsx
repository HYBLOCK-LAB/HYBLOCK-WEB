export default function AuthDivider() {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className="h-px flex-1 bg-monolith-outlineVariant/30" />
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-monolith-onSurfaceMuted">or</span>
      <div className="h-px flex-1 bg-monolith-outlineVariant/30" />
    </div>
  );
}
