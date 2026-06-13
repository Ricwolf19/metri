import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type Props = {
  name?: string | null;
  uri?: string | null;
  color?: string | null;
  size?: number;
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

/** Avatar — shows an image if set, otherwise initials on a deterministic color. */
export const Avatar = ({ name, uri, color, size = 44 }: Props) => {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        transition={150}
      />
    );
  }

  const bg = color ?? pickColor(name);
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }}
      className="items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.4 }} className="font-bold text-ink-950">
        {initials(name)}
      </Text>
    </View>
  );
};
