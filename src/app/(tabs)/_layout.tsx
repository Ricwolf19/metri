import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps, ComponentType } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CompassIcon,
  DumbbellIcon,
  GraphUpIcon,
  HomeIcon,
  type IconProps,
} from '@/components/icons';
import { useAuth } from '@/features/auth/auth-context';
import { useAutoSync } from '@/features/sync/useAutoSync';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const TAB_BAR = {
  dark: { active: '#bef82b', inactive: '#71717a', bg: '#09090b', border: '#2a2a2f' },
  light: { active: '#4d7c0f', inactive: '#a1a1aa', bg: '#ffffff', border: '#d6d6db' },
};

/** WhatsApp-style icon: a rounded pill behind the active tab's icon. */
const TabBarIcon = ({
  Icon,
  color,
  focused,
}: {
  Icon: ComponentType<IconProps>;
  color: string;
  focused: boolean;
}) => {
  const { scheme } = useTheme();
  return (
    <View
      className={[
        'h-7 w-14 items-center justify-center rounded-full',
        focused ? (scheme === 'dark' ? 'bg-brand/15' : 'bg-brand-700/15') : '',
      ].join(' ')}
    >
      <Icon color={color} size={20} strokeWidth={focused ? 2.4 : 2} />
    </View>
  );
};

/** No Android ripple — the active pill is the selection feedback; the default
 * borderless splash reads cheap next to it. */
const TabButton = (props: object) => (
  <Pressable {...(props as ComponentProps<typeof Pressable>)} android_ripple={null} />
);

const TabsLayout = () => {
  const { isReady, isAuthenticated, user } = useAuth();
  const { scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const t = useT();
  const bar = TAB_BAR[scheme];

  // Premium: sync training data on foreground (no-op for free users).
  useAutoSync();

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
        tabBarShowLabel: true,
        tabBarActiveTintColor: bar.active,
        tabBarInactiveTintColor: bar.inactive,
        tabBarButton: TabButton,
        tabBarLabelStyle: {
          fontFamily: 'Geist_500Medium',
          fontSize: 10,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: bar.bg,
          borderTopColor: bar.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: (p) => (
            <TabBarIcon Icon={HomeIcon} color={p.color as string} focused={p.focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: t('tab.train'),
          tabBarIcon: (p) => (
            <TabBarIcon Icon={DumbbellIcon} color={p.color as string} focused={p.focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="metrics"
        options={{
          title: t('tab.progress'),
          tabBarIcon: (p) => (
            <TabBarIcon Icon={GraphUpIcon} color={p.color as string} focused={p.focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t('tab.explore'),
          tabBarIcon: (p) => (
            <TabBarIcon Icon={CompassIcon} color={p.color as string} focused={p.focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
