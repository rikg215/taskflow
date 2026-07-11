import type { ReactNode } from 'react';

/**
 * A deliberately tiny markdown subset for task descriptions:
 * `# ## ###` headers, `-`/`*` bullet lists, **bold**, *italic*, `inline code`.
 * Renders React nodes directly — no dangerouslySetInnerHTML, no dependency.
 */

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith('**')) {
      out.push(
        <strong key={key++} className="font-semibold text-zinc-100">
          {tok.slice(2, -2)}
        </strong>,
      );
    } else if (tok.startsWith('`')) {
      out.push(
        <code key={key++} className="rounded bg-white/[0.07] px-1 py-0.5 font-mono text-[0.85em] text-emerald-300">
          {tok.slice(1, -1)}
        </code>,
      );
    } else {
      out.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];

  const flush = (key: string) => {
    if (!list.length) return;
    blocks.push(
      <ul key={`ul-${key}`} className="list-disc space-y-1 pl-5 marker:text-zinc-600">
        {list.map((item, i) => (
          <li key={i}>{inline(item)}</li>
        ))}
      </ul>,
    );
    list = [];
  };

  lines.forEach((line, i) => {
    const t = line.trim();
    if (/^[-*]\s+/.test(t)) {
      list.push(t.replace(/^[-*]\s+/, ''));
      return;
    }
    flush(String(i));
    if (!t) return;
    if (t.startsWith('### ')) {
      blocks.push(<h4 key={i} className="pt-1 text-[13px] font-bold text-zinc-100">{inline(t.slice(4))}</h4>);
    } else if (t.startsWith('## ')) {
      blocks.push(<h3 key={i} className="pt-1 text-sm font-bold text-zinc-100">{inline(t.slice(3))}</h3>);
    } else if (t.startsWith('# ')) {
      blocks.push(<h3 key={i} className="pt-1 text-[15px] font-bold text-zinc-100">{inline(t.slice(2))}</h3>);
    } else {
      blocks.push(<p key={i}>{inline(t)}</p>);
    }
  });
  flush('end');

  return <div className="space-y-2 text-sm leading-relaxed text-zinc-300">{blocks}</div>;
}
