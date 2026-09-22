import { useForm } from 'react-hook-form';
import { useSession } from '@/providers/SessionProvider';
import { signInSchema, type SignInValues } from './schemas';

export function useApiKeySignIn() {
  const { signIn } = useSession();
  const form = useForm<SignInValues>({ defaultValues: { apiKey: '' } });
  const onSubmit = form.handleSubmit(async values => {
    form.clearErrors();
    const result = signInSchema.safeParse(values);
    if (!result.success) {
      form.setError('apiKey', { message: result.error.issues[0]?.message ?? 'Enter your API key.' });
      return;
    }
    try { await signIn(result.data.apiKey); }
    catch { form.setError('root', { message: 'Unable to save your API key. Please try again.' }); }
  });
  return { form, onSubmit };
}
