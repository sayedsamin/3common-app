import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';
import { pagesKeys } from './queries';
import type { ElementProps, Page } from './schemas';
export type PageOperation = { type: 'create'; name: string } | { type: 'copy'; id: string; name: string } | { type: 'rename'; id: string; name: string } | { type: 'section'; id: string } | { type: 'element'; id: string; sectionId: string; kind: 'text' | 'image' | 'button' } | { type: 'props'; id: string; elementId: string; props: ElementProps } | { type: 'move'; id: string; sectionId: string; toIndex: number } | { type: 'remove'; id: string; sectionId: string; elementId: string; isLast: boolean };
export function usePageOperation() {
  const client = useQueryClient();
  return useMutation({ mutationFn: async (action: PageOperation): Promise<{ data: Page; sectionId?: string; elementId?: string }> => { switch (action.type) {
    case 'create': return api.createPage({ name: action.name, medium: 'email' });
    case 'copy': return api.duplicatePage(action.id, { name: action.name });
    case 'rename': return api.updatePage(action.id, { name: action.name });
    case 'section': return api.addSection(action.id, {});
    case 'element': return api.addElement(action.id, { sectionId: action.sectionId, type: action.kind, breakpoint: 'default', layout: { row: 0, col: 0, rowSpan: 1, colSpan: 12 } });
    case 'props': return api.updateElement(action.id, action.elementId, { props: action.props });
    case 'move': return api.positionSection(action.id, action.sectionId, { toIndex: action.toIndex });
    case 'remove': return action.isLast ? api.deleteElement(action.id, action.elementId) : api.deleteSection(action.id, action.sectionId);
  } }, retry: false, networkMode: 'always', onMutate: async () => { await client.cancelQueries({ queryKey: pagesKeys.all }); }, onSuccess: result => { client.setQueryData(pagesKeys.detail(result.data.id), result.data); void client.invalidateQueries({ queryKey: ['pages', 'list'] }); } });
}
