import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';

import { Avatar } from './ui/Avatar';

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showAvatar?: boolean;
  right?: React.ReactNode;
};

/**
 * The app navbar. Sits at the top of a screen (headers are disabled globally).
 * Shows a back chevron on pushed screens, and the signed-in user's avatar on
 * the right which deep-links to the profile.
 */
export const TopBar = ({ title, subtitle, showBack, showAvatar = true, right }: Props) => {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
      <View className="flex-1 flex-row items-center">
        {showBack ? (
          <Pressable
            hitSlop={10}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-ink-800"
          >
            <Text className="text-lg text-ink-100">‹</Text>
          </Pressable>
        ) : null}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-ink-50" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-sm text-ink-400" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {right ??
        (showAvatar && user ? (
          <Pressable
            hitSlop={8}
            onPress={() => router.push('/(tabs)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Avatar
              name={user.displayName ?? user.username}
              uri={user.avatarUri}
              color={user.avatarColor}
              size={40}
            />
          </Pressable>
        ) : null)}
    </View>
  );
};
