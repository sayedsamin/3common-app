import { View } from 'react-native';
import { Button, Icon, Text } from '@/components/ui';
import type { ChatRequest } from '../contracts';
import type { Message } from '../store';
import { AssistantMessage } from './AssistantMessage';
import { ResultCards } from './ResultCards';

export function ChatMessage({ message, isBusy, cooldown, onRetry }: { message: Message; isBusy: boolean; cooldown: number; onRetry: (id: string, body: ChatRequest) => void }) {
  if (message.role === 'user') return <View className="mb-6 max-w-[88%] self-end rounded-2xl rounded-br-sm bg-primary px-4 py-3"><Text selectable className="text-on-primary leading-6">{message.content}</Text></View>;
  return <View className="mb-7 gap-3">
    <View className="flex-row items-center gap-2"><Icon name="creation" size={16} tone="muted" /><Text variant="caption">3common assistant</Text></View>
    {message.content ? <AssistantMessage content={message.content} /> : null}
    {message.resultKeys?.map(key => <ResultCards key={key} resultId={key} />)}
    {message.error ? <View className="gap-2 rounded-control bg-surface-muted p-3"><Text accessibilityRole="alert">{message.error.service}: {message.error.message}</Text>
      {message.retry ? <Button label={cooldown ? `Retry in ${cooldown}s` : 'Retry'} variant="secondary" disabled={isBusy || cooldown > 0} onPress={() => { if (message.retry) onRetry(message.id, message.retry); }} /> : null}
    </View> : null}
  </View>;
}
