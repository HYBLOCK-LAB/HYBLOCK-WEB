import SiteChrome from '@/components/SiteChrome';

export const metadata = {
  title: '이용약관 | HYBLOCK',
};

export default function TermsOfServicePage() {
  return (
    <SiteChrome activePath="/terms-of-service">
      <main className="min-h-screen px-6 py-16 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 shadow-monolith md:p-10">
          <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Terms Of Service
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-monolith-onSurface md:text-5xl">
            이용약관
          </h1>
          <p className="mt-5 text-sm leading-7 text-monolith-onSurfaceMuted">
            시행일: 2026-04-07
          </p>

          <div className="mt-10 space-y-8 text-sm leading-8 text-monolith-onSurface">
            <section>
              <h2 className="text-xl font-bold text-monolith-primary">1. 목적</h2>
              <p className="mt-3">
                본 약관은 HYBLOCK 웹사이트 및 관련 운영 기능의 이용 조건과 절차, 이용자와 운영 주체의 권리 및 책임을 정하는 것을 목적으로 합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">2. 서비스 범위</h2>
              <ul className="mt-3 list-disc pl-6">
                <li>학회 소개 및 공지 제공</li>
                <li>회원 로그인 및 지갑 연결</li>
                <li>출석 기록 및 활동 관리</li>
                <li>EAS 증명 발급 및 SBT 수료증 발급 기능</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">3. 이용자 책임</h2>
              <ul className="mt-3 list-disc pl-6">
                <li>이용자는 본인 계정과 지갑을 직접 관리해야 합니다.</li>
                <li>허위 정보 입력, 부정 출석, 무단 접근 시 서비스 이용이 제한될 수 있습니다.</li>
                <li>블록체인 거래 및 지갑 사용에 따른 책임은 이용자 본인에게 있습니다.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">4. 서비스 변경 및 중단</h2>
              <p className="mt-3">
                HYBLOCK는 운영상 필요에 따라 서비스의 일부를 변경하거나 중단할 수 있습니다. 중요한 변경이 있는 경우 가능한 범위에서 사전 안내합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">5. 면책</h2>
              <p className="mt-3">
                네트워크 장애, 외부 지갑 서비스, 블록체인 네트워크 문제, 제3자 인프라 장애 등 HYBLOCK가 직접 통제할 수 없는 사유로 발생한 문제에 대해서는 책임이 제한될 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">6. 문의</h2>
              <p className="mt-3">
                서비스 이용과 관련한 문의는 HYBLOCK 운영진 공식 채널을 통해 접수할 수 있습니다.
              </p>
            </section>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
