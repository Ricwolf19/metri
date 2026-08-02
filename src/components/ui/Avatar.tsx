import { Image } from 'expo-image';
import { View } from 'react-native';

import MetriLogo from '@/assets/images/metri-logo.svg';
import { StarIcon } from '@/components/icons';

type Props = {
  uri?: string | null;
  size?: number;
  /** Shows a small premium star badge overlay. */
  premium?: boolean;
};

/**
 * Avatar — the user's photo if they set one, otherwise the Metri mark on the
 * constant near-black badge (same rule as BrandLogo: the wordmark only reads on
 * a dark surface, so the disc never follows the theme).
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
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-ink-950"
    >
      <MetriLogo width={size * 0.62} height={size * 0.62 * 0.73} />
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
