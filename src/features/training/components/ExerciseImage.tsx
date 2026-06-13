import { Image } from 'expo-image';
import { View } from 'react-native';

import { DumbbellIcon } from '@/components/icons';

import { getExerciseImage } from '../exercise-images';

type Props = {
  /** Exercise slug — used to resolve a bundled photo. */
  id: string;
  /** On-disk URI for a user-created exercise's own photo (wins when set). */
  imageUrl?: string | null;
  size?: number;
  rounded?: string;
};

/**
 * Resolves an exercise thumbnail with a graceful fallback chain:
 * custom on-disk photo → bundled Free Exercise DB photo → muscle/dumbbell icon.
 */
export const ExerciseImage = ({ id, imageUrl, size = 56, rounded = 'rounded-xl' }: Props) => {
  const source = imageUrl ? { uri: imageUrl } : getExerciseImage(id);

  if (source) {
    return (
      <Image
        source={source}
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
      <DumbbellIcon color="#566077" size={size * 0.45} />
    </View>
  );
};
