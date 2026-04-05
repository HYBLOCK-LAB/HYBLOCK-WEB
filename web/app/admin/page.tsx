import SiteChrome from '@/components/SiteChrome';

export default function AdminEntryPage() {
  return (
    <SiteChrome activePath="/admin">
      <main>
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
          <div className="rounded-[2rem] bg-monolith-surfaceLowest p-8 shadow-[0_20px_50px_rgba(0,51,97,0.08)] md:p-10">
            <p className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">Admin</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-monolith-primary md:text-5xl">관리자 페이지</h1>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
