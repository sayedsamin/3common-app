import type { PropsWithChildren } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

type ScreenProps = PropsWithChildren<{ className?: string }>;

export function Screen({ children, className }: ScreenProps) {
  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View className={cn('flex-1 gap-4 p-6', className)}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
