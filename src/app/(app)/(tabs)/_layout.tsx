import { Tabs } from 'expo-router/js-tabs';
import { AppHeader } from '@/components/navigation/AppHeader';
import { BottomBar } from '@/components/navigation/BottomBar';
export default function TabLayout() {
  return <Tabs initialRouteName="index" backBehavior="history" tabBar={props => <BottomBar {...props} />} screenOptions={{ header: ({ options }) => <AppHeader title={options.title ?? 'Home'} />, animation: 'none' }}>
    <Tabs.Screen name="index" options={{ title: 'Home' }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    <Tabs.Screen name="ai" options={{ title: 'AI' }} />
  </Tabs>;
}
