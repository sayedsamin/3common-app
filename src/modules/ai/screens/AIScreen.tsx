import { FlashList } from '@shopify/flash-list';
import { View } from 'react-native';
import { Button, Icon, IconButton, Input, LoadingState, Screen, Text } from '@/components/ui';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useChat } from '../hooks';
import { ChatMessage } from '../components/ChatMessage';

const starters = ['Show my open events this month', 'Find opted-in contacts sorted by spending', 'Find events with more than 10 sales'];
export function AIScreen() {
  const chat = useChat();
  const isReducedMotion = useReducedMotion();
  return <Screen scrollable={false} edges={['left', 'right']} className="gap-0 p-0 md:p-0">
    <View className="flex-row items-center gap-2 border-b border-border px-4 py-1">
      <View className="min-w-0 flex-1"><Text variant="label">Events &amp; contacts only</Text><Text variant="caption">Read-only assistant</Text></View>
      <IconButton label="New chat" icon="square-edit-outline" onPress={chat.newChat} />
    </View>
    <View className="min-h-0 flex-1">
    <FlashList data={chat.messages} keyExtractor={item => item.id} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 12 }}
      maintainVisibleContentPosition={{ autoscrollToBottomThreshold: 0.2, animateAutoScrollToBottom: !isReducedMotion }}
      ListEmptyComponent={<View className="gap-5 py-6"><View className="gap-3"><Icon name="creation" size={32} tone="muted" /><Text variant="title">What would you like to find?</Text><Text variant="muted">Explore your events and contacts. Ask a question, then refine your results as you chat.</Text></View>
        <View className="gap-2">{starters.map(prompt => <Button key={prompt} label={prompt} variant="secondary" onPress={() => chat.setDraft(prompt)} />)}</View>
        <Text variant="caption">Relevant results are sent to OpenAI. Chat history lasts only for this app session. Records cannot be changed.</Text>
      </View>}
      renderItem={({ item }) => <ChatMessage message={item} isBusy={chat.isBusy} cooldown={chat.cooldown} onRetry={(id, body) => { void chat.send({ id, body }); }} />}
      ListFooterComponent={chat.isBusy ? <LoadingState label="Searching events and contacts…" /> : null} />
    </View>
    <View className="gap-1 border-t border-border bg-background px-3 py-2">
      {chat.cooldown > 0 ? <Text variant="caption" accessibilityLiveRegion="polite">You can send again in {chat.cooldown}s</Text> : null}
      <View className="flex-row items-end gap-2"><View className="min-w-0 flex-1"><Input label="Message" hideLabel placeholder="Ask a follow-up…" multiline maxLength={4000} value={chat.draft} onChangeText={chat.setDraft} style={{ maxHeight: 112 }} /></View>
        {chat.isBusy ? <IconButton label="Stop" icon="stop" variant="secondary" onPress={chat.stop} /> : <IconButton label="Send message" icon="arrow-up" variant="secondary" disabled={!chat.draft.trim() || chat.cooldown > 0} onPress={() => { void chat.send(); }} />}
      </View>
    </View>
  </Screen>;
}
