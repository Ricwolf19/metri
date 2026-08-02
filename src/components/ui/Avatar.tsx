import { Image } from 'expo-image';
import { View } from 'react-native';

import MetriIcon from '@/assets/images/metri-icon.svg';
import { StarIcon } from '@/components/icons';

type Props = {
  uri?: string | null;
  size?: number;
  /** Shows a small premium star badge overlay. */
  premium?: boolean;
};

/**
 * Avatar — the user's photo if they set one, otherwise the Metri isotype
 * cropped to a circle (the icon ships its own near-black background, so it
 * reads the same on any theme).
 */
export const Avatar = ({ uri, size = 44, premium = false }: Props) => {
  const inner = uri ? (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, size * 0.045),
        borderColor: '#bef82b',
      }}
      contentFit="cover"
      transition={150}
    />
  ) : (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <MetriIcon width={size} height={size} />
    </View>
  );

  if (!premium) return inner;

  const badge = Math.max(14, size * 0.4);
  return (
    <View style={{ width: size, height: size }}>
      {inner}
      <View
        style={{
          position: 'absolute',
          bottom: -2,
          right: -2,
          width: badge,
          height: badge,
          borderRadius: badge / 2,
        }}
        className="items-center justify-center border-2 border-ink-900 bg-brand"
        accessibilityLabel="Premium"
      >
        <StarIcon color="#08090d" size={badge * 0.6} />
      </View>
    </View>
  );
};
