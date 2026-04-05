type AuthShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  mode: 'login' | 'signup';
  children: React.ReactNode;
  aside?: React.ReactNode;
};

export default function AuthShell({ eyebrow, title, description, mode, children, aside }: AuthShellProps) {
  const isLogin = mode === 'login';

  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
      <div className={aside ? 'grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]' : ''}>
        <div className={aside ? 'overflow-hidden rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest shadow-monolith' : 'mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest shadow-monolith'}>
          <div className="border-b border-monolith-outlineVariant/20 bg-[linear-gradient(135deg,rgba(0,51,97,0.96),rgba(14,74,132,0.88))] px-8 py-10 text-center text-white md:px-10 md:py-12">
            <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-monolith-primaryFixed">
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.06em] md:text-5xl">
              {title}
            </h1>
            {description ? <p className="mt-5 text-sm leading-7 text-white/78 md:text-base">{description}</p> : null}
          </div>

          <div className="px-8 py-8 text-center md:px-10 md:py-10">
            {children}
          </div>
        </div>

        {aside ? (
          <aside className="rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 shadow-monolith md:p-10">
            {aside}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
