import { useState } from 'react';
import { Text } from 'react-native';

import { ScrollArea, Sheet } from '@/components/ui';
import type { Exercise } from '@/db/schema';
import { useT } from '@/i18n';

import { ExerciseList } from './ExerciseList';

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  /** Exercises already in the session: offering them again would duplicate a slot. */
  exclude: ReadonlySet<string>;
  onPick: (exercise: Exercise) => void;
};

/**
 * The library, searchable, minus what the session already holds — opened from
 * the phantom chip at the end of the session strip. Fixed height, so the sheet
 * does not resize under the finger while the search narrows the list.
 */
export const AddExerciseSheet = ({ visible, onClose, userId, exclude, onPick }: Props) => {
  const t = useT();
  // The library list is long: built on the first open, kept for the next.
  const [opened, setOpened] = useState(false);
  if (visible && !opened) setOpened(true);
  return (
    <Sheet visible={visible} onClose={onClose} snapPoints={['92%']}>
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-lg font-sans-bold text-ink-50">{t('training.addExercise')}</Text>
        <Text className="mb-3 text-sm leading-5 text-ink-400">{t('training.addExerciseHint')}</Text>
        {opened ? (
          <ExerciseList
            userId={userId}
            exclude={exclude}
            onPick={(exercise) => {
              onClose();
              onPick(exercise);
            }}
          />
        ) : null}
      </ScrollArea>
    </Sheet>
  );
};
