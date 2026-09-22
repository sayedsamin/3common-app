import { cleanup, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { renderWithProviders } from '@/test/render';
import { parseInline, parseMarkdown, safeChatLink } from '../markdown';
import { AssistantMessage } from '../components/AssistantMessage';

afterEach(async () => { await cleanup(); jest.restoreAllMocks(); });

test('formats headings, paragraphs and nested ordered/unordered lists', () => {
  const blocks = parseMarkdown('## Upcoming events\n\nHere are **two** matches.\n\n1. First event\n   - Downtown\n2. Second event');
  expect(blocks[0]).toEqual({ kind: 'heading', text: 'Upcoming events' });
  expect(blocks[1]).toEqual({ kind: 'paragraph', text: 'Here are **two** matches.' });
  expect(blocks[2]).toEqual({ kind: 'list', items: [{ marker: '1.', text: 'First event', indent: 0 }, { marker: '•', text: 'Downtown', indent: 1 }, { marker: '2.', text: 'Second event', indent: 0 }] });
  expect(parseInline('**two** *open* `events`')).toEqual([{ kind: 'bold', text: 'two' }, { kind: 'text', text: ' ' }, { kind: 'italic', text: 'open' }, { kind: 'text', text: ' ' }, { kind: 'code', text: 'events' }]);
});

test('parses tables, quotes, separators and incomplete code fences without losing content', () => {
  expect(parseMarkdown('| Name | Status |\n| --- | :---: |\n| Gala | **Open** |')).toEqual([{ kind: 'table', headers: ['Name', 'Status'], rows: [['Gala', '**Open**']] }]);
  expect(parseMarkdown('> One page only\n\n---\n\n```text\nA **literal** value')).toEqual([{ kind: 'quote', text: 'One page only' }, { kind: 'rule' }, { kind: 'code', language: 'text', text: 'A **literal** value' }]);
});

test('unsafe link schemes and embedded credentials cannot become actionable links', () => {
  for (const url of ['javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd', 'https://user:password@example.com']) expect(safeChatLink(url)).toBeUndefined();
  expect(parseInline('[unsafe](javascript:bad)')).toEqual([{ kind: 'text', text: 'unsafe' }]);
  expect(safeChatLink('https://example.com/events')).toBe('https://example.com/events');
});

test('renders readable assistant content and opens only validated links', async () => {
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  await renderWithProviders(<AssistantMessage content={'## Events found\n\n**Gala night** is *open*.\n\n- Tickets available\n\n[Venue](https://example.com/venue)\n\n[Unsafe](javascript:bad)'} />);
  expect(screen.getByRole('header', { name: 'Events found' })).toBeTruthy();
  expect(screen.getByText('Gala night')).toBeTruthy(); expect(screen.queryByText('**Gala night**')).toBeNull();
  expect(screen.queryByRole('link', { name: 'Unsafe' })).toBeNull();
  await fireEvent.press(screen.getByRole('link', { name: 'Venue' }));
  expect(open).toHaveBeenCalledWith('https://example.com/venue');
});

test('table contents remain readable without raw Markdown separators', async () => {
  await renderWithProviders(<AssistantMessage content={'| Event | Status |\n| --- | --- |\n| Gala | Open |'} />);
  expect(screen.getByText('Gala')).toBeTruthy(); expect(screen.getByText('Status')).toBeTruthy();
  expect(screen.queryByText('| --- | --- |')).toBeNull();
});
