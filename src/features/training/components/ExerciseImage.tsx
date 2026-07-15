import { Image } from 'expo-image';
import { View } from 'react-native';

import { DumbbellIcon } from '@/components/icons';

type Props = {
  /** On-disk URI for a user-created exercise's own photo. */
  imageUrl?: string | null;
  size?: number;
  rounded?: string;
};

/**
 * Resolves an exercise thumbnail: custom on-disk photo → muscle/dumbbell icon.
 */
export const ExerciseImage = ({ imageUrl, size = 56, rounded = 'rounded-field' }: Props) => {
  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size }}
        className={`${rounded} bg-ink-700`}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size }}
      className={`${rounded} items-center justify-center bg-ink-700`}
    >
      <DumbbellIcon color="#71717a" size={size * 0.45} />
    </View>
  );
};
