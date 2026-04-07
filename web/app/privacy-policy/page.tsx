import SiteChrome from '@/components/SiteChrome';

export const metadata = {
  title: '개인정보처리방침 | HYBLOCK',
};

export default function PrivacyPolicyPage() {
  return (
    <SiteChrome activePath="/privacy-policy">
      <main className="min-h-screen px-6 py-16 lg:px-8">
        <section className="mx-auto max-w-4xl rounded-[2rem] border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-8 shadow-monolith md:p-10">
          <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-monolith-primaryContainer">
            Privacy Policy
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-monolith-onSurface md:text-5xl">
            개인정보처리방침
          </h1>
          <p className="mt-5 text-sm leading-7 text-monolith-onSurfaceMuted">
            시행일: 2026-04-07
          </p>

          <div className="mt-10 space-y-8 text-sm leading-8 text-monolith-onSurface">
            <section>
              <h2 className="text-xl font-bold text-monolith-primary">1. 수집하는 정보</h2>
              <p className="mt-3">
                HYBLOCK는 학회 홈페이지 및 운영 기능 제공을 위해 최소한의 정보를 수집할 수 있습니다.
              </p>
              <ul className="mt-3 list-disc pl-6">
                <li>Google 로그인 시 제공되는 이메일, 이름 등 계정 정보</li>
                <li>지갑 로그인 시 연결된 지갑 주소</li>
                <li>출석, 외부 활동, 산출물, 증명 발급 및 SBT 발급 관련 운영 데이터</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">2. 이용 목적</h2>
              <ul className="mt-3 list-disc pl-6">
                <li>회원 식별 및 로그인 처리</li>
                <li>출석 및 활동 기록 관리</li>
                <li>EAS 증명 발급 및 SBT 수료증 발급</li>
                <li>서비스 운영, 오류 대응 및 보안 관리</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">3. 보관 및 보호</h2>
              <p className="mt-3">
                수집된 정보는 서비스 운영 목적 범위 안에서만 사용하며, 접근 권한을 제한하고 합리적인 보호 조치를 적용합니다.
                블록체인에 기록되는 정보는 서비스 구조상 공개적으로 조회될 수 있으므로, 온체인에는 필요한 최소 정보만 반영합니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">4. 제3자 제공</h2>
              <p className="mt-3">
                HYBLOCK는 법령상 요구가 있는 경우를 제외하고, 이용자의 개인정보를 본 방침에 기재된 범위를 넘어 제3자에게 제공하지 않습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">5. 외부 서비스</h2>
              <p className="mt-3">
                서비스는 Google OAuth, Supabase, WalletConnect, EVM RPC 등 외부 인프라를 사용할 수 있습니다. 각 서비스의 데이터 처리는 해당 제공자의 정책을 따를 수 있습니다.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-monolith-primary">6. 문의</h2>
              <p className="mt-3">
                개인정보 처리와 관련한 문의는 HYBLOCK 운영진에게 전달할 수 있습니다. 연락처 및 공식 채널은 학회 홈페이지 공지 또는 공식 SNS를 통해 안내합니다.
              </p>
            </section>
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
