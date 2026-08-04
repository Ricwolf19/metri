import { Redirect, Tabs, useRouter } from 'expo-router';
import { type BottomTabBarProps } from 'expo-router/tabs';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useRef, type ComponentType } from 'react';
import { Pressable, Text } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppleIcon,
  CompassIcon,
  DumbbellIcon,
  GraphUpIcon,
  HomeIcon,
  type IconProps,
} from '@/components/icons';
import { useDialog } from '@/components/ui';
import { ScrollVisibilityProvider, useScrollVisibility } from '@/components/ui/scroll-visibility';
import { useAuth } from '@/features/auth/auth-context';
import {
  abandonWorkout,
  activeWorkoutQuery,
  finishWorkout,
} from '@/features/training/session.repo';
import { useAutoSync } from '@/features/sync/useAutoSync';
import { useWidgetSync } from '@/features/widget/useWidgetSync';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

const TAB_BAR = {
  dark: { active: '#bef82b', inactive: '#71717a', pill: 'rgba(190,248,43,0.13)' },
  light: { active: '#4d7c0f', inactive: '#a1a1aa', pill: 'rgba(77,124,15,0.12)' },
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
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!focused) return;
    pop.value = 0.85;
    pop.value = withSpring(1, { damping: 12, stiffness: 320 });
  }, [focused, pop]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View
      // Inline borderRadius so the active highlight can never render square.
      style={[
        {
          borderRadius: 9999,
          backgroundColor: focused ? TAB_BAR[scheme].pill : 'transparent',
        },
        anim,
      ]}
      className="h-8 w-16 items-center justify-center"
    >
      <Icon color={color} size={20} strokeWidth={focused ? 2.4 : 2} />
    </Animated.View>
  );
};

/**
 * Floating Uber-style pill bar: detached from the screen edges, rounded, with
 * its own shadow. Rides the shared scroll-visibility value — slides off-screen
 * on scroll-down, back on scroll-up (same gesture that reveals the header).
 */
const FloatingTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { scheme } = useTheme();
  const vis = useScrollVisibility();
  const shown = vis?.shown;
  const bar = TAB_BAR[scheme];

  const anim = useAnimatedStyle(() => {
    const v = shown ? shown.value : 1;
    return { transform: [{ translateY: interpolate(v, [0, 1], [insets.bottom + 120, 0]) }] };
  }, [shown, insets.bottom]);

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: insets.bottom + 8,
          shadowColor: '#000',
          shadowOpacity: scheme === 'dark' ? 0.45 : 0.18,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 16,
        },
        anim,
      ]}
      className="flex-row rounded-[28px] border border-ink-700/60 bg-ink-850/95 px-1.5 py-2"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? bar.active : bar.inactive;
        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.title}
            className="flex-1 items-center rounded-full py-0.5"
          >
            {options.tabBarIcon?.({ focused, color, size: 20 })}
            <Text style={{ color }} className="mt-0.5 font-sans-medium text-[9px]">
              {options.title}
            </Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
};

const TabsLayout = () => {
  const { isReady, isAuthenticated, user } = useAuth();
  const t = useT();

  const router = useRouter();
  const dialog = useDialog();

  // Premium: sync training data on foreground (no-op for free users).
  useAutoSync();
  // Keep the Android home-screen widget fed with fresh local data.
  useWidgetSync();

  // Focus mode: an in-progress session owns the app. Fresh (today, <8h) →
  // jump straight into it on launch; stale → ask whether to save or discard.
  const { data: actives } = useLiveQuery(activeWorkoutQuery(user?.id ?? ''));
  const activeWorkout = actives[0] ?? null;
  const focusHandled = useRef(false);
  useEffect(() => {
    if (!activeWorkout || focusHandled.current) return;
    focusHandled.current = true;
    const ageHours = (Date.now() - activeWorkout.startedAt.getTime()) / 3_600_000;
    if (ageHours > 8) {
      dialog.show({
        title: t('training.staleTitle'),
        message: t('training.staleBody'),
        actions: [
          { label: t('training.staleFinish'), onPress: () => finishWorkout(activeWorkout.id) },
          {
            label: t('training.cancelWorkout'),
            style: 'destructive',
            onPress: () => abandonWorkout(activeWorkout.id),
          },
        ],
      });
      return;
    }
    router.push({ pathname: '/training/workout/[id]', params: { id: activeWorkout.id } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkout?.id]);

  if (isReady && !isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // First-launch onboarding gate — bounce until the user has set things up.
  if (isReady && isAuthenticated && user && !user.onboardedAt) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <ScrollVisibilityProvider>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          // Lazy mounting made the user watch each section's first render — the
          // entrance animation plus live queries landing a frame late read as a
          // layout jump. Queries are local SQLite, so mounting all five up
          // front is cheap and every tab opens already settled.
          lazy: false,
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
          name="nutrition"
          options={{
            title: t('tab.nutrition'),
            tabBarIcon: (p) => (
              <TabBarIcon Icon={AppleIcon} color={p.color as string} focused={p.focused} />
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
    </ScrollVisibilityProvider>
  );
};

export default TabsLayout;
