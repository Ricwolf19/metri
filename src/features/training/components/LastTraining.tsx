import { Text, View } from 'react-native';

import { ScrollRow } from '@/components/ui';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

import { describeLoad } from '../load';
import type { PreviousSession } from '../session.repo';
import { ConvertibleWeight } from './ConvertibleWeight';

/**
 * The last time THIS exercise was trained, whatever split or week it sat in:
 * every working set as weight × reps, plus how the load was built when a set
 * carries that detail.
 */
export const LastTraining = ({ previous, unit }: { previous: PreviousSession; unit: Units }) => {
  const t = useT();
  const { dayMonth } = useDateFormat();
  const withLoad = previous.sets.find((s) => s.load && s.load.kind !== 'dumbbell');
  return (
    <View className="mt-2">
      <Text className="text-xs text-ink-400">
        {t('training.lastTraining')} · {dayMonth(previous.finishedAt)}
      </Text>
      <View className="mt-1">
        <ScrollRow className="gap-1.5">
          {previous.sets.map((s) => (
            <View
              key={s.id}
              className="shrink-0 flex-row items-center rounded-field bg-ink-850 px-2 py-1"
            >
              {s.load?.kind === 'dumbbell' && s.load.hands === 2 ? (
                <Text className="text-xs text-ink-400">2 × </Text>
              ) : null}
              <ConvertibleWeight kg={s.weightKg} unit={unit} />
              <Text className="text-xs text-ink-400"> × {s.reps}</Text>
            </View>
          ))}
        </ScrollRow>
      </View>
      {withLoad?.load ? (
        <Text className="mt-1 text-xs text-ink-500">{describeLoad(withLoad.load, unit).parts}</Text>
      ) : null}
    </View>
  );
};
