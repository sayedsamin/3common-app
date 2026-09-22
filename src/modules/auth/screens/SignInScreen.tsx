import { Controller } from 'react-hook-form';
import { Platform, View } from 'react-native';
import { Button, Input, Screen, Text } from '@/components/ui';
import { useApiKeySignIn } from '../hooks';

export function SignInScreen() {
  const { form, onSubmit } = useApiKeySignIn();
  const { errors, isSubmitting } = form.formState;
  return (
    <Screen className="justify-center">
      <View className="w-full max-w-lg self-center gap-6">
        <View className="gap-3">
          <Text variant="title" accessibilityRole="header">Welcome to 3common</Text>
          <Text variant="muted">Enter your API key to get started.</Text>
        </View>
        <Controller control={form.control} name="apiKey" render={({ field }) => (
          <Input label="API key" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur}
            secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="off"
            textContentType="none" returnKeyType="go" disabled={isSubmitting}
            onSubmitEditing={() => { if (!isSubmitting) void onSubmit(); }} error={errors.apiKey?.message}
            helperText="Paste the key only, without the Bearer prefix." />
        )} />
        <Text variant="caption">{Platform.OS === 'web'
          ? 'Your key is kept in memory for this session. Enter it again after refreshing or closing this page.'
          : 'Your key is stored securely on this device and used to authenticate API requests.'}</Text>
        {errors.root?.message ? <Text accessibilityRole="alert" className="text-danger">{errors.root.message}</Text> : null}
        <Button label="Continue" loading={isSubmitting} onPress={() => void onSubmit()} />
      </View>
    </Screen>
  );
}
