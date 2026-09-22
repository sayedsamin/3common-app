import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { ApiError } from '@/lib/api-client';
import { Button, Input, QueryFeedback, Text } from '@/components/ui';
import { pageQueryOptions, pagesQueryOptions } from '../queries';
import { usePageOperation, type PageOperation } from '../mutations';
import { canEditSection } from '../utils';
import { BlockEditor } from './BlockEditor';
import { ElementPreview } from './PagePreview';

export function PageBuilder({ value, onChange, onDirtyChange, disabled = false }: { value: string; onChange: (id: string) => void; onDirtyChange: (dirty: boolean) => void; disabled?: boolean }) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0); const [name, setName] = useState(''); const [showPicker, setShowPicker] = useState(!value);
  const [editableIds, setEditableIds] = useState<string[]>([]); const [active, setActive] = useState<string>(); const [dirty, setDirty] = useState(false); const [error, setError] = useState(''); const busy = useRef(false);
  const pendingInsert = useRef<{ pageId: string; sectionId: string; kind: 'text' | 'image' | 'button' } | undefined>(undefined);
  const list = useQuery({ ...pagesQueryOptions(search, page), enabled: showPicker }); const detail = useQuery({ ...pageQueryOptions(value), enabled: Boolean(value) }); const operation = usePageOperation();
  const isBusy = disabled || operation.isPending; const editable = editableIds.includes(value); const onBlockDirty = useCallback((next: boolean) => setDirty(next), []);
  const pageNameDirty = editable && Boolean(detail.data) && name !== detail.data?.name;
  useEffect(() => { onDirtyChange(dirty || pageNameDirty || operation.isPending); return () => onDirtyChange(false); }, [dirty, pageNameDirty, operation.isPending, onDirtyChange]);
  async function run(action: PageOperation) { if (busy.current || disabled) return; busy.current = true; setError(''); try { return await operation.mutateAsync(action); } catch (e) { setError(e instanceof ApiError ? e.message : 'Unable to save this page. Refresh before retrying.'); if (action.type !== 'create' && action.type !== 'copy') await detail.refetch(); } finally { busy.current = false; } }
  async function create() { const result = await run({ type: 'create', name: name.trim() || 'Email content' }); if (result) { setEditableIds(ids => [...ids, result.data.id]); setName(result.data.name); onChange(result.data.id); setShowPicker(false); } }
  async function copy() { if (!detail.data) return; const result = await run({ type: 'copy', id: value, name: `${detail.data.name} — email copy` }); if (result) { setEditableIds(ids => [...ids, result.data.id]); setName(result.data.name); onChange(result.data.id); setActive(undefined); } }
  async function add(kind: 'text' | 'image' | 'button') {
    if (!detail.data || dirty || busy.current) return;
    const pending = pendingInsert.current;
    if (pending?.pageId === value && pending.kind === kind) {
      const saved = detail.data.sections.find(section => section.id === pending.sectionId)?.elements.find(element => element.type === kind);
      if (saved) { setActive(saved.id); pendingInsert.current = undefined; setError(''); return; }
    }
    // An empty persisted section is reused after an interrupted insertion.
    let sectionId = detail.data.sections.find(section => section.elements.length === 0)?.id;
    if (!sectionId) { const result = await run({ type: 'section', id: value }); if (!result || !('sectionId' in result)) return; sectionId = result.sectionId; }
    if (!sectionId) return;
    pendingInsert.current = { pageId: value, sectionId, kind };
    const result = await run({ type: 'element', id: value, sectionId, kind }); if (result?.elementId) { setActive(result.elementId); pendingInsert.current = undefined; }
  }
  return <View className="gap-4"><Text variant="label">Email content</Text>
    {error ? <Text accessibilityRole="alert">{error}</Text> : null}
    <Button label={showPicker ? 'Close page picker' : 'Choose a saved page'} variant="secondary" disabled={isBusy || dirty || pageNameDirty} onPress={() => setShowPicker(!showPicker)} />
    {showPicker ? <View className="gap-3"><Input label="Search pages" value={search} disabled={isBusy} onChangeText={text => { setSearch(text); setPage(0); }} /><QueryFeedback query={list} label="pages" />
      <View style={{ height: 120 }}><FlashList horizontal data={list.data?.data ?? []} keyExtractor={item => item.id} renderItem={({ item }) => <View style={{ width: 240 }} className="pr-3"><Button label={item.name} variant="secondary" disabled={isBusy || dirty} onPress={() => { onChange(item.id); setName(item.name); setActive(undefined); setShowPicker(false); }} /></View>} /></View>
      {list.data?.data.length === 0 ? <Text>No pages found.</Text> : null}
      <View className="flex-row gap-2"><Button label="Previous pages" disabled={isBusy || page === 0 || list.isFetching} onPress={() => setPage(page - 1)} /><Button label="Next pages" disabled={isBusy || !list.data?.hasMore || list.isFetching} onPress={() => setPage(page + 1)} /></View>
      <Input label="New page name" value={name} onChangeText={setName} disabled={isBusy} /><Button label="Create page" disabled={isBusy || dirty} onPress={() => { void create(); }} />
    </View> : null}
    {value ? <><QueryFeedback query={detail} label="page content" />{detail.data ? <><Text>{detail.data.name}</Text>
      {!editable ? <><Text>Editing creates a separate copy for this email.</Text><Button label="Make editable copy" disabled={isBusy || dirty || detail.isFetching || Boolean(detail.error)} onPress={() => { void copy(); }} /></> : <View className="gap-2"><Text>Content operations save immediately. Save campaign settings to link this page.</Text><Input label="Page name" value={name} onChangeText={setName} disabled={isBusy} placeholder={detail.data.name} /><Button label="Save page name" disabled={isBusy || !name.trim() || dirty} onPress={() => { void run({ type: 'rename', id: value, name: name.trim() }).then(result => { if (result) setName(result.data.name); }); }} /><Button label="Reset page name" variant="secondary" disabled={isBusy || !pageNameDirty} onPress={() => setName(detail.data.name)} /></View>}
      {detail.data.sections.map((section, index) => { const element = section.elements[0]; const supported = canEditSection(section); return <View key={section.id} className="gap-3 rounded-card border border-border p-3">
        <Text variant="label">Block {index + 1}: {element?.type ?? 'empty'}</Text>
        {!supported && element ? <Text>This layout is preserved and read-only in the simple builder.</Text> : null}
        {section.elements.map(item => <ElementPreview key={item.id} element={item} />)}
        {editable && supported && element ? <><Button label={active === element.id ? 'Close block' : 'Edit block'} disabled={isBusy || dirty} variant="secondary" onPress={() => setActive(active === element.id ? undefined : element.id)} />
          {active === element.id ? <BlockEditor key={element.id} element={element} disabled={isBusy} onDirty={onBlockDirty} onSave={async props => Boolean(await run({ type: 'props', id: value, elementId: element.id, props }))} /> : null}
          <View className="flex-row flex-wrap gap-2"><Button label={`Move block ${index + 1} up`} disabled={isBusy || dirty || index === 0} variant="secondary" onPress={() => { void run({ type: 'move', id: value, sectionId: section.id, toIndex: index - 1 }); }} /><Button label={`Move block ${index + 1} down`} disabled={isBusy || dirty || index === detail.data.sections.length - 1} variant="secondary" onPress={() => { void run({ type: 'move', id: value, sectionId: section.id, toIndex: index + 1 }); }} /><Button label={`Remove block ${index + 1}`} disabled={isBusy || dirty} variant="destructive" onPress={() => { void run({ type: 'remove', id: value, sectionId: section.id, elementId: element.id, isLast: detail.data.sections.length === 1 }); }} /></View>
        </> : null}
      </View>; })}
      {editable ? <View className="flex-row flex-wrap gap-2">{(['text', 'image', 'button'] as const).map(kind => <Button key={kind} label={`Add ${kind}`} disabled={isBusy || dirty || detail.isFetching || Boolean(detail.error)} onPress={() => { void add(kind); }} />)}</View> : null}
    </> : null}</> : null}
  </View>;
}
