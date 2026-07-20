import type { ReactNode } from 'react';
import Link from 'next/link';
import SiteChrome from '@/components/SiteChrome';

const labPages = [
  { href: '/design-lab', label: 'Landing' },
  { href: '/design-lab/editorial', label: 'Editorial' },
  { href: '/design-lab/application', label: 'Application' },
  { href: '/design-lab/dashboard', label: 'Dashboard' },
];

type DesignLabShellProps = {
  activePath: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function DesignLabShell({
  activePath,
  eyebrow,
  title,
  description,
  children,
}: DesignLabShellProps) {
  return (
    <SiteChrome activePath="/design-lab">
      <main className="min-h-screen bg-monolith-surface">
        <header className="border-b border-monolith-outline-variant/30 bg-monolith-surface-lowest">
          <div className="mx-auto max-w-7xl px-6 pb-12 pt-10 lg:px-8 lg:pb-16 lg:pt-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-monolith-primary">
                  {eyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-monolith-on-surface sm:text-5xl lg:text-6xl">
                  {title}
                </h1>
                <p className="mt-5 max-w-2xl break-keep text-base leading-8 text-monolith-on-surface-muted sm:text-lg">
                  {description}
                </p>
              </div>

              <nav aria-label="Design lab pages" className="flex max-w-full gap-2 overflow-x-auto pb-1">
                {labPages.map((page) => {
                  const isActive = page.href === activePath;
                  return (
                    <Link
                      key={page.href}
                      href={page.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={[
                        'interactive-soft inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold',
                        isActive
                          ? 'bg-monolith-primary text-white'
                          : 'border border-monolith-outline-variant/40 bg-monolith-surface-low text-monolith-on-surface-muted hover:bg-monolith-surface-high hover:text-monolith-primary',
                      ].join(' ')}
                    >
                      {page.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </header>

        {children}
      </main>
    </SiteChrome>
  );
}
