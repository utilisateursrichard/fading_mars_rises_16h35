import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Rend une expression mathématique LaTeX via KaTeX (importé localement) ou fallback stylisé
 */
function renderKatexString(expr: string, displayMode: boolean, key: string | number): React.ReactNode {
  const trimmed = expr.trim();
  if (!trimmed) return null;

  try {
    const html = katex.renderToString(trimmed, {
      displayMode,
      throwOnError: false
    });
    return (
      <span
        key={key}
        className={displayMode ? "block my-2 overflow-x-auto text-center py-1" : "inline-block px-0.5 align-baseline"}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch {
    // Ignorer erreur et utiliser fallback propre
  }

  // Fallback propre et élégant sans crash
  if (displayMode) {
    return (
      <div key={key} className="my-2.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 font-mono text-xs text-indigo-900 overflow-x-auto text-center">
        $${trimmed}$$
      </div>
    );
  }

  return (
    <span key={key} className="font-mono text-[11px] sm:text-xs bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-100/80">
      ${trimmed}$
    </span>
  );
}

/**
 * Découpe et formate le texte en ligne (gras, italique, code, liens, LaTeX inline)
 */
function renderInlineContent(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Pattern pour tokens inline :
  // 1: LaTeX inline $...$ ou \(...\)
  // 2: Code inline `...`
  // 3: Gras **...**
  // 4: Italique *...*
  // 5: Lien [label](url)
  const pattern = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|(?:\$([^\$\n]+?)\$)|(?:\\\(([\s\S]*?)\\\))|(`[^`\n]+`)|(\*\*[^*]+?\*\*)|(?:\*([^*]+?)\*)|(?:\[([^\]]+)\]\(([^)]+)\)))/;

  while (remaining.length > 0) {
    const match = remaining.match(pattern);
    if (!match || match.index === undefined) {
      nodes.push(remaining);
      break;
    }

    const matchIdx = match.index;
    if (matchIdx > 0) {
      nodes.push(remaining.slice(0, matchIdx));
    }

    const matchedStr = match[0];
    const key = `inline-${keyIdx++}`;

    // Display math embedded inline $$...$$ ou \[...\]
    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      const expr = matchedStr.slice(2, -2);
      nodes.push(renderKatexString(expr, true, key));
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      const expr = matchedStr.slice(2, -2);
      nodes.push(renderKatexString(expr, true, key));
    }
    // Inline math $...$ ou \(...\)
    else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      const expr = matchedStr.slice(1, -1);
      nodes.push(renderKatexString(expr, false, key));
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      const expr = matchedStr.slice(2, -2);
      nodes.push(renderKatexString(expr, false, key));
    }
    // Code inline `...`
    else if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      nodes.push(
        <code key={key} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-indigo-700 font-mono text-[11px] sm:text-xs font-semibold border border-slate-200/70">
          {matchedStr.slice(1, -1)}
        </code>
      );
    }
    // Gras **...**
    else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      nodes.push(
        <strong key={key} className="font-bold text-slate-900">
          {renderInlineContent(matchedStr.slice(2, -2))}
        </strong>
      );
    }
    // Italique *...*
    else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      nodes.push(
        <em key={key} className="italic text-slate-800">
          {renderInlineContent(matchedStr.slice(1, -1))}
        </em>
      );
    }
    // Lien [label](url)
    else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 font-medium"
          >
            {linkMatch[1]}
          </a>
        );
      } else {
        nodes.push(matchedStr);
      }
    } else {
      nodes.push(matchedStr);
    }

    remaining = remaining.slice(matchIdx + matchedStr.length);
  }

  return nodes;
}

/**
 * Parse un tableau au format Markdown GFM
 */
function parseMarkdownTable(lines: string[]): { headers: string[]; rows: string[][]; alignments: ('left' | 'center' | 'right')[] } | null {
  if (lines.length < 2) return null;

  const parseRow = (rowLine: string) => {
    let clean = rowLine.trim();
    if (clean.startsWith('|')) clean = clean.slice(1);
    if (clean.endsWith('|')) clean = clean.slice(0, -1);
    return clean.split('|').map(c => c.trim());
  };

  const headers = parseRow(lines[0]);
  const sepLine = lines[1].trim();

  // Vérifier la ligne de séparation |---|---|
  if (!/^\|?(\s*:?-+:?\s*\|?)+$/.test(sepLine)) {
    return null;
  }

  const sepParts = parseRow(sepLine);
  const alignments: ('left' | 'center' | 'right')[] = sepParts.map(part => {
    const hasLeft = part.startsWith(':');
    const hasRight = part.endsWith(':');
    if (hasLeft && hasRight) return 'center';
    if (hasRight) return 'right';
    return 'left';
  });

  const rows: string[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    rows.push(parseRow(line));
  }

  return { headers, rows, alignments };
}

/**
 * Composant de rendu Markdown et LaTeX Zero-External-Dependency
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Bloc de code ```
    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      const lang = trimmed.slice(3).trim();
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Sauter la ligne de fermeture ```

      elements.push(
        <div key={`block-${elementKey++}`} className="my-2.5 rounded-xl bg-slate-900 text-slate-100 p-3.5 overflow-x-auto text-xs font-mono border border-slate-800 shadow-xs">
          {lang && <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">{lang}</div>}
          <pre className="leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
      continue;
    }

    // 2. Bloc Display Math LaTeX $$ ... $$
    if (trimmed.startsWith('$$')) {
      if (trimmed.endsWith('$$') && trimmed.length > 4) {
        // Sur une seule ligne
        const expr = trimmed.slice(2, -2);
        elements.push(renderKatexString(expr, true, `block-${elementKey++}`));
        i++;
        continue;
      }

      // Multi-lignes
      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('$$')) {
        mathLines.push(lines[i]);
        i++;
      }
      i++; // Fermeture $$
      elements.push(renderKatexString(mathLines.join('\n'), true, `block-${elementKey++}`));
      continue;
    }

    // 3. Bloc Display Math LaTeX \[ ... \]
    if (trimmed.startsWith('\\[') || trimmed === '\\[') {
      if (trimmed.endsWith('\\]') && trimmed.length > 4) {
        const expr = trimmed.slice(2, -2);
        elements.push(renderKatexString(expr, true, `block-${elementKey++}`));
        i++;
        continue;
      }

      const mathLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('\\]')) {
        mathLines.push(lines[i]);
        i++;
      }
      i++; // Fermeture \]
      elements.push(renderKatexString(mathLines.join('\n'), true, `block-${elementKey++}`));
      continue;
    }

    // 4. Tableaux Markdown GFM (| col 1 | col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|')) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && lines[j].trim().startsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }

      const parsedTable = parseMarkdownTable(tableLines);
      if (parsedTable) {
        i = j;
        elements.push(
          <div key={`block-${elementKey++}`} className="my-3 w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-xs bg-white">
            <table className="min-w-full text-left text-xs sm:text-sm divide-y divide-slate-200 border-collapse">
              <thead className="bg-slate-50/90 text-slate-800 font-bold border-b border-slate-200">
                <tr>
                  {parsedTable.headers.map((h, colIdx) => (
                    <th
                      key={colIdx}
                      className={`px-3.5 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 text-${parsedTable.alignments[colIdx] || 'left'}`}
                    >
                      {renderInlineContent(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {parsedTable.rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/70 transition-colors">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`px-3.5 py-2 text-slate-700 align-top border-t border-slate-100 text-${parsedTable.alignments[cellIdx] || 'left'}`}
                      >
                        {renderInlineContent(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 5. Titres
    if (trimmed.startsWith('#### ')) {
      elements.push(
        <h5 key={`block-${elementKey++}`} className="text-xs sm:text-sm font-semibold text-slate-800 mt-2.5 mb-1">
          {renderInlineContent(trimmed.slice(5))}
        </h5>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      elements.push(
        <h4 key={`block-${elementKey++}`} className="text-xs sm:text-base font-bold text-slate-900 mt-3 mb-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block shrink-0" />
          <span>{renderInlineContent(trimmed.slice(4))}</span>
        </h4>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      elements.push(
        <h3 key={`block-${elementKey++}`} className="text-sm sm:text-base font-extrabold text-slate-900 mt-3.5 mb-1.5 pb-1 border-b border-slate-100">
          {renderInlineContent(trimmed.slice(3))}
        </h3>
      );
      i++;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      elements.push(
        <h2 key={`block-${elementKey++}`} className="text-base sm:text-lg font-extrabold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-100">
          {renderInlineContent(trimmed.slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // 6. Citations >
    if (trimmed.startsWith('> ') || trimmed === '>') {
      const quoteLines: string[] = [trimmed.slice(2)];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('> ') || lines[j].trim() === '>')) {
        quoteLines.push(lines[j].trim().slice(2));
        j++;
      }
      i = j;
      elements.push(
        <blockquote key={`block-${elementKey++}`} className="border-l-3 border-indigo-500 bg-indigo-50/40 px-3.5 py-2 my-2 rounded-r-xl text-slate-700 italic leading-relaxed">
          {renderInlineContent(quoteLines.join(' '))}
        </blockquote>
      );
      continue;
    }

    // 7. Listes à puces (- ou *)
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const listItems: string[] = [trimmed.slice(2)];
      let j = i + 1;
      while (j < lines.length && (lines[j].trim().startsWith('- ') || lines[j].trim().startsWith('* '))) {
        listItems.push(lines[j].trim().slice(2));
        j++;
      }
      i = j;
      elements.push(
        <ul key={`block-${elementKey++}`} className="space-y-1.5 my-2 pl-2">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-800 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
              <div className="flex-1">{renderInlineContent(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 8. Listes numérotées (1. 2.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const listItems: Array<{ num: string; text: string }> = [{ num: numMatch[1], text: numMatch[2] }];
      let j = i + 1;
      while (j < lines.length) {
        const nextMatch = lines[j].trim().match(/^(\d+)\.\s+(.*)$/);
        if (nextMatch) {
          listItems.push({ num: nextMatch[1], text: nextMatch[2] });
          j++;
        } else {
          break;
        }
      }
      i = j;
      elements.push(
        <ol key={`block-${elementKey++}`} className="space-y-1.5 my-2 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2 text-slate-800 leading-relaxed">
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] shrink-0 mt-0.5 border border-indigo-100">
                {item.num}
              </span>
              <div className="flex-1">{renderInlineContent(item.text)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 9. Ligne vide
    if (!trimmed) {
      i++;
      continue;
    }

    // 10. Paragraphe régulier
    elements.push(
      <p key={`block-${elementKey++}`} className="leading-relaxed text-slate-800">
        {renderInlineContent(line)}
      </p>
    );
    i++;
  }

  return (
    <div className={`markdown-tutor-content text-xs sm:text-sm leading-relaxed space-y-2 font-normal ${className}`}>
      {elements}
    </div>
  );
};
