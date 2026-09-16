import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/** Normalise les délimiteurs LaTeX pour remark-math. */
function preprocessLaTeX(content: string): string {
  if (!content) return '';

  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, (_match, equation) => `\n$$\n${equation.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_match, equation) => `$${equation.trim()}$`)
    .replace(/(^|[^$\\])\$\s+([^$\n]+?)\s+\$(?!\$)/g, '$1$$$2$$');
}

const REMARK_PLUGINS = [remarkMath, remarkGfm];
const REHYPE_PLUGINS = [rehypeKatex];

const MARKDOWN_COMPONENTS: React.ComponentProps<typeof ReactMarkdown>['components'] = {
  p: ({ children }) => <p className="leading-relaxed text-slate-800 last:mb-0">{children}</p>,
  h1: ({ children }) => (
    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="text-sm sm:text-base font-extrabold text-slate-900 mt-3.5 mb-1.5 pb-1 border-b border-slate-100">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-3 mb-1 flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block shrink-0" />
      <span>{children}</span>
    </h4>
  ),
  h4: ({ children }) => <h5 className="text-xs sm:text-sm font-semibold text-slate-800 mt-2 mb-1">{children}</h5>,
  ul: ({ children }) => <ul className="list-disc list-outside ml-4 space-y-1 my-1.5 text-slate-800 marker:text-indigo-500">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-outside ml-4 space-y-1 my-1.5 text-slate-800 marker:text-indigo-600 marker:font-semibold">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed pl-1">{children}</li>,
  table: ({ children }) => (
    <div className="my-3 w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-xs bg-white">
      <table className="min-w-full text-left text-xs sm:text-sm divide-y divide-slate-200 border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50/90 text-slate-800 font-bold border-b border-slate-200">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-3.5 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700">{children}</th>,
  td: ({ children }) => <td className="px-3.5 py-2.5 text-slate-700 align-top border-t border-slate-100">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-indigo-500 bg-indigo-50/40 px-3 py-2 my-2 rounded-r-xl text-slate-700 italic">
      {children}
    </blockquote>
  ),
  code: ({ className: codeClassName, children, ...props }) => {
    if (!codeClassName) {
      return (
        <code className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 font-mono text-[11px] sm:text-xs font-semibold border border-slate-200/70" {...props}>
          {children}
        </code>
      );
    }

    return (
      <div className="my-2.5 rounded-xl bg-slate-900 text-slate-100 p-3.5 overflow-x-auto text-xs font-mono border border-slate-800 shadow-xs">
        <code className={codeClassName} {...props}>{children}</code>
      </div>
    );
  },
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium">
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-t border-slate-200/80" />
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content, className = '' }) => {
  const processed = useMemo(() => preprocessLaTeX(content), [content]);

  return (
    <div className={`markdown-tutor-content text-xs sm:text-sm leading-relaxed space-y-2.5 ${className}`}>
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
});
