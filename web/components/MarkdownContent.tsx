import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MarkdownContent({ content }: { content: string }) {
  return (
    <div
      className={[
        'max-w-none text-base leading-8 text-monolith-onSurface',
        '[&_a]:font-semibold [&_a]:text-monolith-primaryContainer [&_a]:underline [&_a]:underline-offset-4',
        '[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-monolith-primaryContainer/35 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-monolith-onSurfaceMuted',
        '[&_code]:rounded [&_code]:bg-monolith-surfaceHigh [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.92em]',
        '[&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:tracking-[-0.04em]',
        '[&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:tracking-[-0.04em]',
        '[&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold',
        '[&_hr]:my-8 [&_hr]:border-monolith-outlineVariant/30',
        '[&_img]:rounded-xl [&_img]:border [&_img]:border-monolith-outlineVariant/20',
        '[&_li]:ml-5 [&_li]:pl-1',
        '[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
        '[&_p]:my-4',
        '[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-monolith-surfaceHigh [&_pre]:p-4',
        '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
        '[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse',
        '[&_tbody_tr]:border-t [&_tbody_tr]:border-monolith-outlineVariant/20',
        '[&_td]:border [&_td]:border-monolith-outlineVariant/20 [&_td]:px-3 [&_td]:py-2',
        '[&_th]:border [&_th]:border-monolith-outlineVariant/20 [&_th]:bg-monolith-surfaceHigh [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold',
        '[&_ul]:my-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
      ].join(' ')}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
