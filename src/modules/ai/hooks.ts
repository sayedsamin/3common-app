import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AIRequestError } from './api';
import { useSendChat } from './mutations';
import { chatResultKey, resultPageQueryOptions, resultQueryOptions } from './queries';
import { onChatReset, registerChatController, resetChat, stopChatRequests, useChatStore } from './store';
import type { ChatError, ChatRequest, Result } from './contracts';

let sequence = 0;
export function useChat() {
  const client = useQueryClient();
  const messages = useChatStore(s => s.messages); const draft = useChatStore(s => s.draft); const isBusy = useChatStore(s => s.isBusy);
  const retryAt = useChatStore(s => s.retryAt); const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (retryAt <= Date.now()) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, [retryAt]);
  useEffect(() => onChatReset(() => { void client.cancelQueries({ queryKey: ['ai'] }); client.removeQueries({ queryKey: ['ai'] }); }), [client]);
  const mutation = useSendChat();
  async function send(retry?: { id: string; body: ChatRequest }) {
    const state = useChatStore.getState();
    if (state.isBusy || state.retryAt > Date.now() || (!retry && !state.draft.trim())) return;
    const body: ChatRequest = retry?.body ?? { messages: [...state.messages.filter(m => !m.error).map(m => ({ role: m.role, content: m.content.slice(0, 4000) })), { role: 'user' as const, content: state.draft.trim() }].slice(-12), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', context: state.context };
    const id = retry?.id ?? `turn-${++sequence}`; const generation = state.generation;
    useChatStore.setState({ isBusy: true, draft: retry ? state.draft : '', messages: retry ? state.messages : [...state.messages, { id: `${id}-user`, role: 'user', content: state.draft.trim() }] });
    const controller = new AbortController(); const unregister = registerChatController(controller);
    try {
      const response = await mutation.mutateAsync({ body, signal: controller.signal });
      if (useChatStore.getState().generation !== generation) return;
      if (controller.signal.aborted) throw new AIRequestError({ service: 'chat', code: 'cancelled', message: 'Request stopped. You can retry your question.' });
      const resultKeys = response.results.map((result, i) => { const key = `${id}-${i}`; client.setQueryDefaults(chatResultKey(key), { gcTime: Infinity }); client.setQueryData<Result>(chatResultKey(key), result); return key; });
      useChatStore.setState(s => ({ messages: [...s.messages.filter(m => m.id !== id), { id, role: 'assistant', content: response.text, resultKeys: resultKeys.length ? resultKeys : s.messages.find(m => m.id === id)?.resultKeys, error: response.error, retry: response.error ? body : undefined }], context: response.results.length ? response.results.map(r => r.query).slice(-4) : s.context, retryAt: response.error?.retryAfterMs ? Date.now() + response.error.retryAfterMs : 0 }));
    } catch (error) {
      if (useChatStore.getState().generation !== generation) return;
      const detail: ChatError = error instanceof AIRequestError ? error.detail : { service: 'chat', code: 'server', message: 'Unable to send this message. Try again.' };
      useChatStore.setState(s => ({ messages: [...s.messages.filter(m => m.id !== id), { id, role: 'assistant', content: '', resultKeys: s.messages.find(m => m.id === id)?.resultKeys, error: detail, retry: body }], retryAt: detail.retryAfterMs ? Date.now() + detail.retryAfterMs : 0 }));
    } finally { unregister(); if (useChatStore.getState().generation === generation) { useChatStore.setState({ isBusy: false }); mutation.reset(); } }
  }
  function stop() {
    stopChatRequests();
  }
  return { messages, draft, isBusy, cooldown: Math.max(0, Math.ceil((retryAt - now) / 1000)), send, stop, newChat: resetChat, setDraft: (value: string) => useChatStore.setState({ draft: value }) };
}

export function useChatResults(resultId: string) {
  const client = useQueryClient(); const query = useQuery(resultQueryOptions(resultId));
  const [error, setError] = useState(''); const [isLoading, setLoading] = useState(false); const busy = useRef(false);
  async function loadMore() {
    const result = query.data;
    if (!result?.nextQuery || busy.current) return false;
    if (useChatStore.getState().retryAt > Date.now()) { setError('Please wait before retrying.'); return false; }
    const generation = useChatStore.getState().generation;
    const controller = new AbortController(); const unregister = registerChatController(controller);
    busy.current = true; setLoading(true); setError('');
    try {
      const page = await client.fetchQuery(resultPageQueryOptions(resultId, result.nextQuery, controller));
      if (generation !== useChatStore.getState().generation || controller.signal.aborted) return false;
      client.setQueryData<Result>(chatResultKey(resultId), current => current ? { ...current, cards: [...current.cards, ...page.cards.filter(card => !current.cards.some(old => old.id === card.id))], hasMore: page.hasMore, nextQuery: page.nextQuery } : current);
      return true;
    } catch (e) {
      if (generation === useChatStore.getState().generation) {
        setError(e instanceof Error ? e.message : 'Unable to load more results.');
        if (e instanceof AIRequestError && e.detail.retryAfterMs) useChatStore.setState({ retryAt: Date.now() + e.detail.retryAfterMs });
      }
      return false;
    } finally { unregister(); busy.current = false; setLoading(false); }
  }
  return { result: query.data, error, isLoading, loadMore };
}
