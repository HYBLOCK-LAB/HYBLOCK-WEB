import SiteChrome from '@/components/SiteChrome';
import WalletLinkHighlights from '@/components/wallet/WalletLinkHighlights';
import WalletLinkPanel from '@/components/wallet/WalletLinkPanel';
import { walletLinkPageContent } from '@/lib/site-content';

type WalletLinkPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function WalletLinkPage({ searchParams }: WalletLinkPageProps) {
  const params = (await searchParams) ?? {};
  const rawNext = typeof params.next === 'string' ? params.next : '/';
  const nextPath = rawNext.startsWith('/') ? rawNext : '/';
  const intent = typeof params.intent === 'string' ? params.intent : undefined;

  return (
    <SiteChrome activePath="/wallet-link">
      <main className="min-h-screen">
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
            <WalletLinkHighlights content={walletLinkPageContent} />
            <WalletLinkPanel content={walletLinkPageContent} redirectTo={nextPath} intent={intent} />
          </div>
        </section>
      </main>
    </SiteChrome>
  );
}
