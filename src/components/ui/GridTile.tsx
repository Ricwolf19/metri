import { useRouter, type Href } from 'expo-router';
import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { IconProps } from '@/components/icons';
import { useTheme } from '@/theme/theme-context';

export type Tile = {
  id: string;
  title: string;
  href: Href;
  icon: ComponentType<IconProps>;
  /** Muted styling for reading content (guides) vs brand for tools. */
  isDoc?: boolean;
  /** Optional overlay slot (e.g. a pinned checkmark in the customize picker). */
  badge?: React.ReactNode;
  /** Overrides navigation when set (picker mode). */
  onPress?: () => void;
};

/** Square-ish grid tile — two per row, icon on top, short title below. Used by
 * Explore, Home quick access and the quick-access picker. */
export const GridTile = ({ tile }: { tile: Tile }) => {
  const router = useRouter();
  const { brand } = useTheme();
  const Icon = tile.icon;
  return (
    <Pressable
      onPress={tile.onPress ?? (() => router.push(tile.href))}
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(150,150,150,0.10)' }}
      className="w-[48.5%] rounded-card border border-ink-700 bg-ink-850 p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between">
        <View
          className={[
            'h-10 w-10 items-center justify-center rounded-field',
            tile.isDoc ? 'bg-ink-800' : 'bg-brand/15',
          ].join(' ')}
        >
          <Icon color={tile.isDoc ? '#a1a1aa' : brand} size={20} />
        </View>
        {tile.badge}
      </View>
      <Text numberOfLines={2} className="mt-3 text-sm font-sans-semibold leading-5 text-ink-50">
        {tile.title}
      </Text>
    </Pressable>
  );
};
