import { Text, View } from 'react-native';

import { StarIcon } from '@/components/icons';
import { Card } from '@/components/ui';
import type { EffortMode } from '@/db/schema';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import type { ReportExercise } from '../session-report';
import { loggedSetText } from '../summary-copy';

/**
 * The session summary's exercises, each with its sets as they were logged
 * (weight × reps @ effort, in the session's effort mode); a record wears a
 * star, and what was missed stays in red, in words.
 */
export const SummaryExerciseSets = ({
  exercises,
  unit,
  mode,
}: {
  exercises: ReportExercise[];
  unit: Units;
  mode: EffortMode;
}) => {
  const t = useT();
  const { brand } = useTheme();
  return (
    <Card className="gap-4">
      {exercises.map((e, i) => (
        <View key={e.exerciseId} className={i > 0 ? 'border-t border-ink-700 pt-4' : ''}>
          <View className="flex-row items-center gap-2">
            <Text
              numberOfLines={2}
              className="min-w-0 flex-1 text-sm font-sans-semibold text-ink-50"
            >
              {e.name}
            </Text>
            {e.isPr ? (
              <View accessible accessibilityLabel={t('training.topRecord')}>
                <StarIcon color={brand} size={14} />
              </View>
            ) : null}
          </View>
          {e.sets.length ? (
            <View className="mt-1.5 gap-1">
              {e.sets.map((s, n) => (
                <View key={s.id} className="flex-row items-baseline gap-3">
                  <Text className="w-5 font-mono text-xs text-ink-500">{n + 1}</Text>
                  <Text className="min-w-0 flex-1 text-sm text-ink-200">
                    {loggedSetText(s, unit, t, mode)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {e.missed ? (
            <Text className="mt-1.5 text-xs font-sans-medium text-red-400">
              {t('training.summaryMissed', { n: e.missed })}
            </Text>
          ) : null}
        </View>
      ))}
    </Card>
  );
};
