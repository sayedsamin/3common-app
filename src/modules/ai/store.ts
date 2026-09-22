import { create } from 'zustand';
import { onApiSessionChange } from '@/lib/api-session';
import type { ChatError, ChatRequest, Query } from './contracts';

export type Message = { id: string; role: 'user' | 'assistant'; content: string; resultKeys?: string[]; error?: ChatError; retry?: ChatRequest };
type ChatState = { messages: Message[]; context: Query[]; draft: string; isBusy: boolean; generation: number; retryAt: number };
const initial = { messages: [], context: [], draft: '', isBusy: false, retryAt: 0 };
export const useChatStore = create<ChatState>(() => ({ ...initial, generation: 0 }));
const controllers = new Set<AbortController>();
const resetListeners = new Set<() => void>();
export function registerChatController(controller: AbortController) { controllers.add(controller); return () => { controllers.delete(controller); }; }
export function onChatReset(listener: () => void) { resetListeners.add(listener); return () => { resetListeners.delete(listener); }; }
export function stopChatRequests() { controllers.forEach(controller => controller.abort()); }
export function resetChat() {
  controllers.forEach(controller => controller.abort()); controllers.clear();
  useChatStore.setState(state => ({ ...initial, generation: state.generation + 1 }));
  resetListeners.forEach(listener => listener());
}
onApiSessionChange(resetChat);
