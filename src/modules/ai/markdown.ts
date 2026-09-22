// A deliberately small native Markdown subset for model replies. No HTML/images
// are executed or loaded; unsupported syntax remains readable text.
export type Inline = { kind: 'text' | 'bold' | 'italic' | 'code'; text: string } | { kind: 'link'; text: string; url: string };
export type Block =
  | { kind: 'paragraph' | 'heading' | 'quote'; text: string }
  | { kind: 'list'; items: { marker: string; text: string; indent: number }[] }
  | { kind: 'code'; text: string; language: string }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'rule' };

export function safeChatLink(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password) return url.toString();
  } catch { /* Display unsupported links as text. */ }
  return undefined;
}

export function parseInline(text: string): Inline[] {
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|\[[^\]\n]+\]\([^\s)]+\)|\*[^*\n]+\*|_[^_\n]+_)/g;
  const parts: Inline[] = []; let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) parts.push({ kind: 'text', text: text.slice(offset, match.index) });
    const token = match[0];
    if (token.startsWith('`')) parts.push({ kind: 'code', text: token.slice(1, -1) });
    else if (token.startsWith('**') || token.startsWith('__')) parts.push({ kind: 'bold', text: token.slice(2, -2) });
    else if (token.startsWith('[')) {
      const boundary = token.indexOf(']('); const label = token.slice(1, boundary); const url = safeChatLink(token.slice(boundary + 2, -1));
      parts.push(url ? { kind: 'link', text: label, url } : { kind: 'text', text: label });
    } else parts.push({ kind: 'italic', text: token.slice(1, -1) });
    offset = match.index + token.length;
  }
  if (offset < text.length) parts.push({ kind: 'text', text: text.slice(offset) });
  return parts;
}

const listPattern = /^(\s*)([-+*]|\d+[.)])\s+(.+)$/;
function cells(line: string) { return line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(cell => cell.trim().replace(/\\\|/g, '|')); }
function isTableDivider(line: string) { const values = cells(line); return line.includes('|') && values.length > 1 && values.every(cell => /^:?-{3,}:?$/.test(cell)); }
function startsBlock(line: string) { return /^\s*(```|~~~|#{1,6}\s|>|[-*_]{3,}\s*$)/.test(line) || listPattern.test(line); }

export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, '\n').split('\n'); const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    if (!line.trim()) { i++; continue; }
    const fence = /^\s*(```|~~~)(.*)$/.exec(line);
    if (fence) {
      const content: string[] = []; i++;
      while (i < lines.length && !(lines[i] ?? '').trim().startsWith(fence[1] ?? '```')) content.push(lines[i++] ?? '');
      if (i < lines.length) i++;
      blocks.push({ kind: 'code', text: content.join('\n'), language: (fence[2] ?? '').trim() }); continue;
    }
    if (line.includes('|') && isTableDivider(lines[i + 1] ?? '')) {
      const headers = cells(line); const rows: string[][] = []; i += 2;
      while (i < lines.length && (lines[i] ?? '').includes('|') && (lines[i] ?? '').trim()) rows.push(cells(lines[i++] ?? ''));
      blocks.push({ kind: 'table', headers, rows }); continue;
    }
    if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) { blocks.push({ kind: 'rule' }); i++; continue; }
    if (/^\s*#{1,6}\s+/.test(line)) { blocks.push({ kind: 'heading', text: line.replace(/^\s*#{1,6}\s+/, '').replace(/\s+#+\s*$/, '') }); i++; continue; }
    if (listPattern.test(line)) {
      const items: Extract<Block, { kind: 'list' }>['items'] = [];
      while (i < lines.length) {
        const match = listPattern.exec(lines[i] ?? ''); if (!match) break;
        const item = { marker: /^\d/.test(match[2] ?? '') ? match[2] ?? '' : '•', text: match[3] ?? '', indent: Math.min(3, Math.floor((match[1]?.length ?? 0) / 2)) };
        i++;
        while (i < lines.length && /^\s{2,}\S/.test(lines[i] ?? '') && !startsBlock(lines[i] ?? '')) item.text += '\n' + (lines[i++] ?? '').trim();
        items.push(item);
      }
      blocks.push({ kind: 'list', items }); continue;
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i] ?? '')) quote.push((lines[i++] ?? '').replace(/^\s*>\s?/, ''));
      blocks.push({ kind: 'quote', text: quote.join('\n') }); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && (lines[i] ?? '').trim() && !startsBlock(lines[i] ?? '') && !isTableDivider(lines[i + 1] ?? '')) paragraph.push(lines[i++] ?? '');
    blocks.push({ kind: 'paragraph', text: paragraph.join('\n') });
  }
  return blocks;
}
