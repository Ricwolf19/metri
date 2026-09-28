import { Text, View } from 'react-native';

import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';

import { ExerciseNote } from './ExerciseNote';

/**
 * What the lifter wrote down for this exercise, shown on its session card:
 * the routine's note for this slot ("reordered because…", F1) and their own
 * note on the exercise, which follows it into every session (F2).
 */
export const SessionNotes = ({
  slotNote,
  exerciseId,
}: {
  slotNote: string | null | undefined;
  exerciseId: string;
}) => {
  const t = useT();
  const { user } = useAuth();

  return (
    <View>
      {slotNote ? (
        <View className="mt-2 rounded-field border border-ink-700 px-3 py-2">
          <Text className="font-mono-medium text-[10px] tracking-wider text-ink-500">
            {t('editor.notes')}
          </Text>
          <Text className="mt-0.5 text-xs leading-5 text-ink-300">{slotNote}</Text>
        </View>
      ) : null}
      {user ? (
        <ExerciseNote compact userId={user.id} exerciseId={exerciseId} className="mt-2" />
      ) : null}
    </View>
  );
};
