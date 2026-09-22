import { useState } from 'react';
import { Button, Screen, Section, Text } from '@/components/ui';
import { useSession } from '@/providers/SessionProvider';

export function SettingsScreen() {
  const { signOut } = useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);
    try { await signOut(); }
    catch { setError('Unable to remove your saved key. Please try again.'); }
    finally { setIsSigningOut(false); }
  }
  return <Screen edges={['left', 'right', 'bottom']}>
    <Section title="API access">
    <Text variant="muted">To change your API key, sign out and enter a new one.</Text>
    {error ? <Text accessibilityRole="alert" className="text-danger">{error}</Text> : null}
    <Button label="Sign out and remove API key" variant="secondary" leadingIcon="logout" className="self-start" loading={isSigningOut} onPress={() => void handleSignOut()} />
    </Section>
  </Screen>;
}
