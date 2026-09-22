import { simpleTextSchema, type PageSection, type SimpleText, type TextMark } from './schemas';
export function canEditSection(section: PageSection) { const element = section.elements[0]; const layout = element?.layout.default; return section.elements.length === 1 && Boolean(layout && layout.col === 0 && layout.colSpan === 12 && layout.row === 0) && (element?.type === 'image' || element?.type === 'button' || (element?.type === 'text' && simpleTextSchema.safeParse(element.richText).success)); }
export function paragraphText(block: SimpleText['content'][number]) { return block.content?.map(run => run.text).join('') ?? ''; }
export function formatSelection(block: SimpleText['content'][number], start: number, end: number, mark: TextMark): SimpleText['content'][number] {
  if (start === end) return block;
  const content: NonNullable<typeof block.content> = []; let offset = 0;
  for (const run of block.content ?? []) { const a = Math.max(0, start - offset); const b = Math.min(run.text.length, end - offset); if (a >= b) content.push(run); else { if (a) content.push({ ...run, text: run.text.slice(0, a) }); const marks = [...(run.marks ?? []).filter(m => m.type !== mark.type), mark]; content.push({ ...run, text: run.text.slice(a, b), marks }); if (b < run.text.length) content.push({ ...run, text: run.text.slice(b) }); } offset += run.text.length; }
  return { ...block, content };
}
export function replaceText(block: SimpleText['content'][number], value: string): SimpleText['content'][number] {
  const old = paragraphText(block); let start = 0; while (start < old.length && start < value.length && old[start] === value[start]) start++;
  let suffix = 0; while (suffix < old.length - start && suffix < value.length - start && old[old.length - 1 - suffix] === value[value.length - 1 - suffix]) suffix++;
  const content: NonNullable<typeof block.content> = []; let offset = 0; const end = old.length - suffix;
  for (const run of block.content ?? []) { const stop = offset + run.text.length; if (offset < start) { const text = run.text.slice(0, Math.min(run.text.length, start - offset)); if (text) content.push({ ...run, text }); } offset = stop; }
  const inserted = value.slice(start, value.length - suffix); if (inserted) content.push({ type: 'text', text: inserted });
  offset = 0; for (const run of block.content ?? []) { if (offset + run.text.length > end) { const text = run.text.slice(Math.max(0, end - offset)); if (text) content.push({ ...run, text }); } offset += run.text.length; }
  return { ...block, content };
}
