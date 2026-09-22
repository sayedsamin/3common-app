import { Controller } from 'react-hook-form';
import { Platform, View } from 'react-native';
import { Button, Card, Icon, Input, Screen, Text } from '@/components/ui';
import { useApiKeySignIn } from '../hooks';

export function SignInScreen() {
  const { form, onSubmit } = useApiKeySignIn();
  const { errors, isSubmitting } = form.formState;
  return (
    <Screen className="justify-center">
      <View className="w-full max-w-[440px] self-center gap-6 py-6">
        <View className="h-12 w-12 items-center justify-center rounded-card bg-primary"><Icon name="calendar-check-outline" tone="on-primary" size={24} /></View>
        <View className="gap-3">
          <Text variant="title" accessibilityRole="header">Welcome to 3common</Text>
          <Text variant="muted">Your events, all in one place. Connect your account to get started.</Text>
        </View>
        <Card className="gap-5 p-5">
        <Controller control={form.control} name="apiKey" render={({ field }) => (
          <Input label="API key" leadingIcon="key-outline" placeholder="Enter your API key" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off"
            textContentType="none" returnKeyType="go" disabled={isSubmitting}
            onSubmitEditing={() => { if (!isSubmitting) void onSubmit(); }} error={errors.apiKey?.message}
            helperText="Paste the key only, without the Bearer prefix." />
        )} />
        <Text variant="caption">{Platform.OS === 'web'
          ? 'Your key is kept in memory for this session. Enter it again after refreshing or closing this page.'
          : 'Your key is stored securely on this device and used to authenticate API requests.'}</Text>
        {errors.root?.message ? <Text accessibilityRole="alert" className="text-danger">{errors.root.message}</Text> : null}
        <Button label="Continue" trailingIcon="arrow-right" loading={isSubmitting} onPress={() => void onSubmit()} />
        </Card>
      </View>
    </Screen>
  );
}
