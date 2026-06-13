import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { ActivityIcon, HomeIcon, ShieldIcon, type IconProps } from '@/components/icons';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';

const ACTIVE = '#bef82b';
const INACTIVE = '#566077';

const TabBarIcon = ({
  Icon,
  color,
  focused,
}: {
  Icon: (p: IconProps) => React.ReactElement;
  color: ColorValue;
  focused: boolean;
}) => {
  return <Icon color={color as string} size={24} strokeWidth={focused ? 2.4 : 2} />;
};

const TabsLayout = () => {
  const { isReady, isAuthenticated, user, hasRole } = useAuth();
  const t = useT();

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
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          backgroundColor: '#0f1219',
          borderTopColor: '#212737',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
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
      {/* Profile is reachable from the avatar in the top bar, not the tab bar. */}
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('tab.admin'),
          tabBarIcon: (p) => <TabBarIcon Icon={ShieldIcon} color={p.color} focused={p.focused} />,
          // Hide the admin tab entirely for non-admins.
          href: hasRole('admin') ? '/(tabs)/admin' : null,
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
