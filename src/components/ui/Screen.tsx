import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '@/lib/cn';

export type ScreenProps = PropsWithChildren<{ className?: string; scrollable?: boolean }>;
export function Screen({ children, className, scrollable = true }: ScreenProps) {
  const content = <View className={cn('flex-1 gap-6 p-4', className)}>{children}</View>;
  return (
    <View className="flex-1 bg-background">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {scrollable ? <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
