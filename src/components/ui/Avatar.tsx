import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { StarIcon } from '@/components/icons';

type Props = {
  name?: string | null;
  uri?: string | null;
  color?: string | null;
  size?: number;
  /** Shows a small premium star badge overlay. */
  premium?: boolean;
};

/** Palette used when a user has no chosen avatar color. */
export const AVATAR_COLORS = [
  '#bef82b',
  '#38bdf8',
  '#f472b6',
  '#fb923c',
  '#a78bfa',
  '#34d399',
] as const;

const initials = (name?: string | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
};

const pickColor = (name?: string | null): string => {
  if (!name) return AVATAR_COLORS[0];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
};

/** Avatar — a photo (with an accent ring) if set, otherwise initials on a color. */
export const Avatar = ({ name, uri, color, size = 44, premium = false }: Props) => {
  const ring = color ?? pickColor(name);

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: Math.max(2, size * 0.045),
        borderColor: ring,
      }}
      contentFit="cover"
      transition={150}
    />
  ) : (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: ring }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.4 }} className="font-sans-bold text-ink-950">
        {initials(name)}
      </Text>
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
