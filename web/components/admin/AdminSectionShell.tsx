import Link from 'next/link';

const adminLinks = [
  { href: '/admin/members', label: '멤버 관리' },
  { href: '/admin/attendance', label: '출석 관리' },
  { href: '/admin/activities', label: '활동 관리' },
  { href: '/admin/certificates', label: '증명 관리' },
];

type AdminSectionShellProps = {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
};

export default function AdminSectionShell({ title, description, currentPath, children }: AdminSectionShellProps) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] bg-monolith-surfaceLowest p-6 shadow-[0_10px_24px_rgba(0,51,97,0.08)]">
          <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">Admin</p>
          <h2 className="mt-3 text-2xl font-black tracking-[-0.04em] text-monolith-primary">관리 메뉴</h2>
          <div className="mt-6 space-y-2">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={[
                  'flex rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
                  currentPath === link.href
                    ? 'bg-monolith-primary text-white'
                    : 'bg-monolith-surfaceLow text-monolith-onSurface hover:bg-monolith-surface',
                ].join(' ')}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </aside>

        <div className="rounded-[2rem] bg-monolith-surfaceLowest p-8 shadow-[0_20px_50px_rgba(0,51,97,0.08)]">
          <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">Dashboard</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-monolith-primary">{title}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-monolith-onSurfaceMuted">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}
