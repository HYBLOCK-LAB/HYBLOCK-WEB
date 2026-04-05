import type { WalletLinkPageContent } from '@/lib/site-content';

type WalletLinkHighlightsProps = {
  content: WalletLinkPageContent;
};

export default function WalletLinkHighlights({ content }: WalletLinkHighlightsProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-display text-xs font-bold uppercase tracking-[0.24em] text-monolith-primaryContainer">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-0.06em] text-monolith-primary md:text-5xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-monolith-onSurfaceMuted">{content.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {content.highlights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-monolith-outlineVariant/20 bg-monolith-surfaceLowest p-6">
            <h2 className="text-lg font-bold text-monolith-onSurface">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-monolith-onSurfaceMuted">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
