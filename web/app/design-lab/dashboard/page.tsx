import { ArrowUpRight, CircleCheck, Clock3, Users } from 'lucide-react';
import DesignLabShell from '@/components/design-lab/DesignLabShell';

const metrics = [
  { label: 'Active members', value: '42', change: '+8.2%', icon: Users },
  { label: 'Attendance rate', value: '91%', change: '+3.4%', icon: CircleCheck },
  { label: 'Open sessions', value: '03', change: 'Live', icon: Clock3 },
];

const rows = [
  ['김하이', 'Frontend', '출석', '2026.07.20 18:01'],
  ['박블록', 'Research', '출석', '2026.07.20 18:03'],
  ['이체인', 'Backend', '지각', '2026.07.20 18:16'],
  ['최노드', 'Design', '미확인', '—'],
];

export default function DesignLabDashboardPage() {
  return (
    <DesignLabShell
      activePath="/design-lab/dashboard"
      eyebrow="Design Lab · Data"
      title="많은 데이터도 같은 언어로 정리합니다."
      description="출석, 회원, 운영 대시보드처럼 정보 밀도가 높은 화면에서 카드·표·상태 배지가 브랜드 안에서 작동하는지 확인하는 샘플입니다."
    >
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map(({ label, value, change, icon: Icon }) => (
            <article key={label} className="rounded-xl border border-monolith-outline-variant/30 bg-monolith-surface-lowest p-7 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-monolith-on-surface-muted">{label}</p>
                  <p className="mt-3 font-display text-4xl font-black tracking-[-0.06em] text-monolith-on-surface">{value}</p>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-monolith-primary-fixed text-monolith-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-6 flex items-center gap-1 text-xs font-bold text-monolith-primary">
                {change} <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </p>
            </article>
          ))}
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-monolith-outline-variant/30 bg-monolith-surface-lowest shadow-sm">
          <header className="flex flex-col gap-4 border-b border-monolith-outline-variant/30 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-xs font-bold uppercase tracking-[0.18em] text-monolith-primary">Live session</p>
              <h2 className="mt-2 text-2xl font-black text-monolith-on-surface">7월 정기 세션 출석</h2>
            </div>
            <button type="button" className="interactive-soft min-h-11 rounded-lg bg-monolith-primary px-5 text-sm font-bold text-white">명단 내보내기</button>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-monolith-primary-container text-white">
                <tr>
                  {['Member', 'Track', 'Status', 'Checked at'].map((heading) => (
                    <th key={heading} className="px-6 py-4 font-display text-xs font-bold uppercase tracking-[0.14em]">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-monolith-outline-variant/25">
                {rows.map(([name, track, status, checkedAt]) => (
                  <tr key={name} className="transition hover:bg-monolith-surface-low">
                    <td className="px-6 py-5 font-bold text-monolith-on-surface">{name}</td>
                    <td className="px-6 py-5 text-sm text-monolith-on-surface-muted">{track}</td>
                    <td className="px-6 py-5">
                      <span className={[
                        'inline-flex rounded-full px-3 py-1 text-xs font-bold',
                        status === '출석' ? 'bg-emerald-50 text-emerald-700' : status === '지각' ? 'bg-amber-50 text-amber-700' : 'bg-monolith-surface-high text-monolith-on-surface-muted',
                      ].join(' ')}>{status}</span>
                    </td>
                    <td className="px-6 py-5 font-display text-sm text-monolith-on-surface-muted">{checkedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </DesignLabShell>
  );
}
