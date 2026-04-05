type AuthAsideProps = {
  title: string;
  points: string[];
};

export default function AuthAside({ title, points }: AuthAsideProps) {
  return (
    <div>
      <h2 className="text-2xl font-black tracking-tight text-monolith-primary">{title}</h2>
      <div className="mt-8 space-y-4">
        {points.map((point, index) => (
          <div key={point} className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-monolith-primary/60">
              0{index + 1}
            </p>
            <p className="mt-3 text-sm leading-7 text-monolith-onSurfaceMuted">{point}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
