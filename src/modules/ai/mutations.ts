import { useMutation } from '@tanstack/react-query';
import { sendChat } from './api';
import type { ChatRequest } from './contracts';

export function useSendChat() {
  return useMutation({ mutationFn: ({ body, signal }: { body: ChatRequest; signal: AbortSignal }) => sendChat(body, signal), retry: false, networkMode: 'always', gcTime: 0 });
}
