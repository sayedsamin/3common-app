import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';

export type ScreenProps = PropsWithChildren<{ className?: string; scrollable?: boolean; edges?: Edge[] }>;
export function Screen({ children, className, scrollable = true, edges = ['top', 'bottom', 'left', 'right'] }: ScreenProps) {
  const content = <View className={cn('flex-1 gap-6 p-4', className)}>{children}</View>;
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={edges} style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {scrollable ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
