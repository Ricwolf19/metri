import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';

import { BookIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/**
 * The standard "open the technique guide" affordance: a book icon that routes
 * to `/training/exercise/[id]`. One look everywhere an exercise is rendered.
 */
export const ExerciseDocButton = ({
  exerciseId,
  size = 18,
}: {
  exerciseId: string;
  size?: number;
}) => {
  const router = useRouter();
  const t = useT();
  const { brand } = useTheme();

  return (
    <Pressable
      onPress={() =>
        router.push({ pathname: '/training/exercise/[id]', params: { id: exerciseId } })
      }
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t('exercise.openDoc')}
      className="h-9 w-9 items-center justify-center rounded-full border border-brand/30 bg-brand/10"
    >
      <BookIcon color={brand} size={size} />
    </Pressable>
  );
};
