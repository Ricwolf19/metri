import { Text, View } from 'react-native';

import { useT } from '@/i18n';
import { useClockFormat } from '@/lib/useClockFormat';

import type { LoggedSet } from '../day-events';
import { formatClockTime } from '../schedule';
import { buildTimeline, formatRest } from '../session-timeline';

/**
 * A session's sets as one chronological rail: clock time, exercise + set, what
 * was lifted, and the rest actually taken before it. The by-exercise list shows
 * WHAT was done; this shows how the session flowed.
 */
export const SessionTimeline = ({
  exercises,
  formatSet,
}: {
  exercises: { exerciseId: string; name: string; sets: LoggedSet[] }[];
  formatSet: (set: LoggedSet) => string;
}) => {
  const t = useT();
  const clock = useClockFormat();
  const entries = buildTimeline(exercises);
  if (!entries.length) return null;

  return (
    <View className="mt-3 border-t border-ink-800 pt-3">
      {entries.map((s) => {
        const d = new Date(s.loggedAt);
        return (
          <View key={`${s.exerciseId}-${s.setNumber}-${s.loggedAt}`} className="flex-row">
            <Text className="w-16 pt-0.5 font-mono text-xs text-ink-500" numberOfLines={1}>
              {formatClockTime(d.getHours() * 60 + d.getMinutes(), clock)}
            </Text>
            <View className="mr-3 w-px bg-ink-700" />
            <View className="flex-1 pb-3">
              <View className="flex-row items-baseline justify-between">
                <Text className="shrink text-sm font-sans-medium text-ink-100" numberOfLines={1}>
                  <Text className="text-ink-500">{s.setNumber}. </Text>
                  {s.exerciseName}
                </Text>
                <Text className="ml-2 font-mono text-xs text-ink-300">{formatSet(s)}</Text>
              </View>
              {s.restSeconds != null ? (
                <Text className="mt-0.5 font-mono text-[11px] text-ink-500">
                  {t('dayDetail.restTaken', { time: formatRest(s.restSeconds) })}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};
