import { Pressable, Text, View } from 'react-native';

import { ScrollRow } from '@/components/ui';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useDateFormat } from '@/lib/useDateFormat';

import { describeLoad } from '../load';
import type { SetLog } from '@/db/schema';

import { loggedSetLabel } from '../session-a11y';
import type { PreviousSession } from '../session.repo';
import { weightText } from '../set-prefill';
import { WeightText } from './WeightButton';

/**
 * The last time THIS exercise was trained, whatever split or week it sat in:
 * every working set as weight × reps, plus how the load was built when a set
 * carries that detail. A weight opens the picture of that set's load.
 */
export const LastTraining = ({
  previous,
  unit,
  onSetPress,
}: {
  previous: PreviousSession;
  unit: Units;
  /** A set's weight opens its picture. */
  onSetPress?: (set: SetLog) => void;
}) => {
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
          {previous.sets.map((s, i) => {
            const twoDumbbells = s.load?.kind === 'dumbbell' && s.load.hands === 2;
            // The whole chip opens the picture: a 44 dp target, and ONE element
            // that reads the set whole ("Set 1: 60 kg, 8 reps"), not "60 kg".
            return (
              <Pressable
                key={s.id}
                onPress={onSetPress ? () => onSetPress(s) : undefined}
                disabled={!onSetPress}
                accessibilityRole={onSetPress ? 'button' : undefined}
                accessibilityLabel={loggedSetLabel(
                  {
                    n: i + 1,
                    weight: weightText(s.weightKg, unit),
                    unit,
                    reps: s.reps,
                    twoDumbbells,
                  },
                  t,
                )}
                accessibilityHint={onSetPress ? t('training.tapToSeeLoad') : undefined}
                className="min-h-11 shrink-0 flex-row items-center rounded-field bg-ink-850 px-2.5 active:bg-ink-750"
              >
                {twoDumbbells ? <Text className="text-xs text-ink-400">2 × </Text> : null}
                <WeightText kg={s.weightKg} unit={unit} tappable={!!onSetPress} />
                <Text className="text-xs text-ink-400"> × {s.reps}</Text>
              </Pressable>
            );
          })}
        </ScrollRow>
      </View>
      {withLoad?.load ? (
        <Text className="mt-1 text-xs text-ink-500">{describeLoad(withLoad.load, unit).parts}</Text>
      ) : null}
    </View>
  );
};
