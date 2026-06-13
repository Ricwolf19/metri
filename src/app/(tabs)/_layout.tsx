import { Redirect, Tabs } from 'expo-router';
import type { ComponentType } from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ActivityIcon,
  BellIcon,
  BookIcon,
  GearIcon,
  HomeIcon,
  type IconProps,
} from '@/components/icons';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const TAB_BAR = {
  dark: { active: '#bef82b', inactive: '#566077', bg: '#0f1219', border: '#212737' },
  light: { active: '#65a30d', inactive: '#788296', bg: '#ffffff', border: '#e2e7f0' },
};

const TabBarIcon = ({
  Icon,
  color,
  focused,
}: {
  Icon: ComponentType<IconProps>;
  color: ColorValue;
  focused: boolean;
}) => {
  return <Icon color={color as string} size={24} strokeWidth={focused ? 2.4 : 2} />;
};

const TabsLayout = () => {
  const { isReady, isAuthenticated, user } = useAuth();
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const bar = TAB_BAR[scheme];

  if (isReady && !isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // First-launch onboarding gate — bounce until the user has set things up.
  if (isReady && isAuthenticated && user && !user.onboardedAt) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Icons only — labels overflow with five tabs across EN/ES; the title is
        // still set per screen for screen readers.
        tabBarShowLabel: false,
        tabBarActiveTintColor: bar.active,
        tabBarInactiveTintColor: bar.inactive,
        tabBarStyle: {
          backgroundColor: bar.bg,
          borderTopColor: bar.border,
          borderTopWidth: 1,
          // Reserve the device's bottom inset (gesture pill / home indicator) so
          // the bar never sits under it on Android or iPhone.
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: (p) => <TabBarIcon Icon={HomeIcon} color={p.color} focused={p.focused} />,
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: t('tab.tools'),
          tabBarIcon: (p) => <TabBarIcon Icon={ActivityIcon} color={p.color} focused={p.focused} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: t('tab.reminders'),
          tabBarIcon: (p) => <TabBarIcon Icon={BellIcon} color={p.color} focused={p.focused} />,
        }}
      />
      <Tabs.Screen
        name="docs"
        options={{
          title: t('tab.docs'),
          tabBarIcon: (p) => <TabBarIcon Icon={BookIcon} color={p.color} focused={p.focused} />,
        }}
      />
      {/* Config = the profile / settings section (also reachable via the avatar). */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.config'),
          tabBarIcon: (p) => <TabBarIcon Icon={GearIcon} color={p.color} focused={p.focused} />,
        }}
      />
      {/* Admin is reached from the shortcut inside Profile (admins only), not a tab. */}
      <Tabs.Screen name="admin" options={{ href: null }} />
    </Tabs>
  );
};

export default TabsLayout;
