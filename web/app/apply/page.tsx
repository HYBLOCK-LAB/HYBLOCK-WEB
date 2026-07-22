import SiteChrome from '@/components/SiteChrome';
import ApplicationForm from '@/components/recruitment/ApplicationForm';
import { getOpenRecruitment } from '@/lib/recruitment';

export const dynamic = 'force-dynamic';

export default async function ApplyPage() {
  const recruitment = await getOpenRecruitment();
  return <SiteChrome activePath="/apply"><main className="bg-monolith-surface-low">
    <header className="bg-monolith-primary-container px-6 py-16 text-white lg:py-20">
      <div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/70">HYBLOCK Recruitment</p><h1 className="mt-5 break-keep text-4xl font-black sm:text-5xl">{recruitment?.title ?? '지원 접수'}</h1>{recruitment && <p className="mt-5 text-blue-100/80">마감 {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(recruitment.closesAt))}</p>}</div>
    </header>
    <div className="mx-auto max-w-3xl px-6 py-12 lg:py-16">{recruitment ? <ApplicationForm recruitment={recruitment} /> : <section className="rounded-xl border border-monolith-outline-variant bg-white p-10 text-center"><h2 className="text-2xl font-black">현재 진행 중인 모집이 없습니다.</h2><p className="mt-3 text-monolith-on-surface-muted">다음 모집 공지를 기다려 주세요.</p></section>}</div>
  </main></SiteChrome>;
}
