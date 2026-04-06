import SiteChrome from '@/components/SiteChrome';
import Link from 'next/link';
import { ArrowRight, CalendarDays, FileCheck, FolderKanban, Users } from 'lucide-react';
import { requireAdminPageAccess } from '@/lib/admin-auth';

const adminQuickLinks = [
  {
    href: '/admin/members',
    label: '멤버 관리',
    description: '회원 정보와 활성 상태를 확인합니다.',
    icon: Users,
  },
  {
    href: '/admin/attendance',
    label: '출석 관리',
    description: '세션 활성화, QR 확인, 참여 현황을 관리합니다.',
    icon: CalendarDays,
  },
  {
    href: '/admin/activities',
    label: '활동 관리',
    description: '세션과 활동을 추가하고 수정합니다.',
    icon: FolderKanban,
  },
  {
    href: '/admin/certificates',
    label: '증명 관리',
    description: '증명서 발급 대상과 EAS 발급 흐름을 확인합니다.',
    icon: FileCheck,
  },
];

export default async function AdminEntryPage() {
  await requireAdminPageAccess('/admin');

  return (
    <SiteChrome activePath="/admin">
      <main>
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
          <div className="rounded-[2rem] bg-monolith-surfaceLowest p-8 shadow-[0_20px_50px_rgba(0,51,97,0.08)] md:p-10">
            <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">Admin</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-monolith-primary md:text-5xl">관리자 페이지</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-monolith-onSurfaceMuted">
              자주 사용하는 관리 화면으로 바로 이동할 수 있도록 바로가기를 정리했습니다.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {adminQuickLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="interactive-card group rounded-[1.5rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLow p-5 transition hover:-translate-y-1 hover:border-monolith-primaryContainer/35 hover:bg-monolith-surfaceLowest"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-monolith-primaryFixed text-monolith-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-monolith-onSurfaceMuted transition group-hover:text-monolith-primary" />
                    </div>
                    <h2 className="mt-5 text-xl font-black tracking-[-0.04em] text-monolith-onSurface">{link.label}</h2>
                    <p className="mt-3 text-sm leading-6 text-monolith-onSurfaceMuted">{link.description}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
