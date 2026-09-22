import { Drawer, useDrawerStatus, type DrawerContentComponentProps } from 'expo-router/drawer';
import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MenuProvider } from './MenuProvider';
import { useMenu } from './MenuContext';
import { SidebarContent } from './SidebarContent';
function DrawerContents({ navigation }: DrawerContentComponentProps) {
  const isOpen = useDrawerStatus() === 'open';
  const close = useCallback(() => navigation.closeDrawer(), [navigation]);
  return <SidebarContent isOpen={isOpen} close={close} />;
}
function DrawerNavigator() {
  const { width } = useWindowDimensions();
  const { isReduced } = useMenu();
  const surface = useThemeColor('surface');
  return <Drawer drawerContent={props => <DrawerContents {...props} />} screenOptions={{ headerShown: false, drawerPosition: 'left', drawerType: 'front', swipeEnabled: !isReduced, drawerStyle: { width: Math.min(320, width * 0.85), backgroundColor: surface, borderTopRightRadius: 0, borderBottomRightRadius: 0 }, overlayColor: 'rgba(0,0,0,0.45)' }}>
    <Drawer.Screen name="(tabs)" />
  </Drawer>;
}
export function AppDrawer() { return <MenuProvider><DrawerNavigator /></MenuProvider>; }
