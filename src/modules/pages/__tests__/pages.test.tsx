import { useState } from 'react';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { setApiKey } from '@/lib/api-session';
import { renderWithProviders } from '@/test/render';
import { addElement, createPage, duplicatePage, getPage, getPages, updateElement, positionSection, getImages } from '../api';
import { pageResponseSchema, updateElementBodySchema } from '../contracts';
import { simpleTextSchema, type Page, type SimpleText } from '../schemas';
import { canEditSection, formatSelection, paragraphText, replaceText } from '../utils';
import { PageBuilder } from '../components/PageBuilder';
import { RichTextEditor } from '../components/RichTextEditor';
import { ImagePicker } from '../components/ImagePicker';

const fetchMock = jest.spyOn(globalThis, 'fetch');
const base: Page = { id: 'page-1', hostId: 'host-1', name: 'Newsletter', medium: 'email', sections: [{ id: 'section-1', rows: { default: 1 }, elements: [] }], background: { type: 'color', color: '#ffffff' }, schemaVersion: 1, revisionCount: 0 };
const text: SimpleText = { type: 'doc', content: [{ type: 'paragraph', attrs: { textAlign: 'left' }, content: [{ type: 'text', text: 'Hello world' }] }] };
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const textElement = { id: 'element-1', type: 'text' as const, layout: { default: { row: 0, col: 0, rowSpan: 1, colSpan: 12 } }, padding: { top: 0, bottom: 0, left: 0, right: 0 }, richText: text, textColor: '#000000', linkColor: '#0000ff' };
beforeEach(() => { setApiKey('test-key'); jest.mocked(SecureStore.getItemAsync).mockResolvedValue('test-key'); fetchMock.mockReset().mockImplementation(async () => response({ data: base })); });
afterEach(async () => { await cleanup(); setApiKey(null); });
test('page API creates, copies, loads, inserts, updates and reorders using actual contract', async () => {
  await createPage({ name: 'Newsletter', medium: 'email' }); expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: 'POST', body: '{"name":"Newsletter","medium":"email"}' });
  await duplicatePage(base.id, { name: 'Copy' }); expect(fetchMock.mock.calls[1]?.[0]).toMatch(/\/duplicate$/);
  await expect(getPage(base.id)).resolves.toEqual(base);
  fetchMock.mockResolvedValueOnce(response({ data: base, elementId: 'element-1' })); await addElement(base.id, { sectionId: 'section-1', type: 'text', breakpoint: 'default', layout: { row: 0, col: 0, rowSpan: 1, colSpan: 12 } });
  await updateElement(base.id, 'element-1', { props: { richText: text } }); expect(JSON.parse(String(fetchMock.mock.calls[4]?.[1]?.body))).toEqual({ props: { richText: text } });
  await positionSection(base.id, 'section-1', { toIndex: 0 }); expect(fetchMock.mock.calls[5]?.[1]).toMatchObject({ method: 'PUT', body: '{"toIndex":0}' });
  fetchMock.mockResolvedValueOnce(response({ data: [], hasMore: false })); await getPages({ search: 'news & stories', page: 2 }); expect(new URL(String(fetchMock.mock.calls[6]?.[0])).searchParams.get('search')).toBe('news & stories');
});
test('rich text preserves marks through selection formatting and text insertion', () => {
  const block = text.content[0]; if (!block) throw new Error('Missing fixture');
  const bold = formatSelection(block, 0, 5, { type: 'bold' }); const linked = formatSelection(bold, 6, 11, { type: 'link', attrs: { href: 'https://example.com' } });
  expect(linked.content?.[0]?.marks).toEqual([{ type: 'bold' }]); expect(linked.content?.at(-1)?.marks).toEqual([{ type: 'link', attrs: { href: 'https://example.com' } }]);
  const edited = replaceText(linked, 'Hello wonderful world'); expect(paragraphText(edited)).toBe('Hello wonderful world'); expect(edited.content?.at(-1)?.marks).toEqual(linked.content?.at(-1)?.marks);
  expect(updateElementBodySchema.safeParse({ props: { richText: { type: 'doc', content: [edited] } } }).success).toBe(true);
});
test('complex layouts, lists and unsupported marks are preserved as read-only', () => {
  expect(canEditSection({ id: 's', rows: { default: 1 }, elements: [textElement] })).toBe(true);
  expect(canEditSection({ id: 's', rows: { default: 1 }, elements: [textElement, { ...textElement, id: 'e2' }] })).toBe(false);
  expect(simpleTextSchema.safeParse({ type: 'doc', content: [{ type: 'bulletList', content: [] }] }).success).toBe(false);
  const richText = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'test', marks: [{ type: 'underline' }] }] }] };
  expect(simpleTextSchema.safeParse(richText).success).toBe(false);
  expect(pageResponseSchema.safeParse({ data: { ...base, sections: [{ id: 's', rows: { default: 1 }, elements: [{ ...textElement, richText }] }] } }).success).toBe(true);
});
test('rich-text controls edit a heading and apply bold to a selection', async () => {
  function Editor() { const [value, onChange] = useState(text); return <RichTextEditor value={value} onChange={onChange} disabled={false} />; }
  await renderWithProviders(<Editor />); await fireEvent(screen.getByLabelText('Paragraph 1'), 'selectionChange', { nativeEvent: { selection: { start: 0, end: 5 } } }); await fireEvent.press(screen.getByRole('button', { name: 'Bold' })); await fireEvent.press(screen.getByRole('button', { name: 'H1' })); expect(screen.getByLabelText('Paragraph 1')).toHaveProp('value', 'Hello world');
});
test('image picker selects registered asset IDs and supports paging', async () => {
  const asset = { id: 'asset-1', hostId: 'host-1', url: 'https://example.com/image.png', width: 100, height: 100, filename: 'Banner.png', contentType: 'image/png', sizeBytes: 1000, purpose: 'content', createdAt: 1, lastPublishedAt: null }; fetchMock.mockImplementation(async () => response({ data: [asset], hasMore: true }));
  const onChange = jest.fn(); await renderWithProviders(<ImagePicker value="" onChange={onChange} disabled={false} />); await screen.findByRole('button', { name: 'Banner.png' }); await fireEvent.press(screen.getByRole('button', { name: 'Banner.png' })); expect(onChange).toHaveBeenCalledWith('asset-1'); await fireEvent.press(screen.getByRole('button', { name: 'Next images' })); await waitFor(() => expect(new URL(String(fetchMock.mock.calls.at(-1)?.[0])).searchParams.get('page')).toBe('1'));
  await expect(getImages(0)).resolves.toMatchObject({ data: [asset] });
});
test('failed element insertion reuses the already-created section on retry', async () => {
  let current = base; let fail = true;
  fetchMock.mockImplementation(async (url, options) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/pages/')) return response({ data: [{ id: base.id, name: base.name, medium: 'email' }], hasMore: false });
    if (path.endsWith('/duplicate')) { current = { ...base, id: 'copy-1', sections: [{ id: 'full', rows: { default: 1 }, elements: [textElement] }] }; return response({ data: current }); }
    if (path.endsWith('/sections')) { current = { ...current, sections: [...current.sections, { id: 'new-section', rows: { default: 1 }, elements: [] }] }; return response({ data: current, sectionId: 'new-section' }); }
    if (path.endsWith('/elements')) { if (fail) { fail = false; return response({ error: { code: 'VALIDATION', message: 'Try again' } }, 400); } expect(JSON.parse(String(options?.body)).sectionId).toBe('new-section'); return response({ data: current, elementId: 'new-element' }); }
    return response({ data: current });
  });
  function Builder() { const [value, onChange] = useState(base.id); return <PageBuilder value={value} onChange={onChange} onDirtyChange={() => undefined} />; }
  await renderWithProviders(<Builder />); await screen.findByRole('button', { name: 'Make editable copy' }); await fireEvent.press(screen.getByRole('button', { name: 'Make editable copy' })); await screen.findByRole('button', { name: 'Add text' }); await fireEvent.press(screen.getByRole('button', { name: 'Add text' })); await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/elements'))).toHaveLength(1)); await waitFor(() => expect(screen.getByRole('button', { name: 'Add text' })).toBeEnabled()); await fireEvent.press(screen.getByRole('button', { name: 'Add text' })); await waitFor(() => expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/elements'))).toHaveLength(2)); expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/sections'))).toHaveLength(1);
});
