import { Text, View } from 'react-native';

import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';
import type { Units } from '@/lib/storage';

import { avgWeightText, phaseLine } from '../format';
import type { ProgressEntry } from '../useProgressLog';

/** Under a compared photo: which side it is, its date, and the phase week or weekly average. */
export const CompareCaption = ({
  side,
  entry,
  units,
}: {
  side: string;
  entry: ProgressEntry;
  units: Units;
}) => {
  const t = useT();
  const { dateKey } = useDateFormat();
  const detail = [phaseLine(t, entry.stats), avgWeightText(entry.stats, units)]
    .filter(Boolean)
    .join(' · ');
  return (
    <View className="mt-1.5 min-w-0">
      <Text
        numberOfLines={1}
        className="font-mono-medium text-xs uppercase tracking-wider text-brand"
      >
        {side}
      </Text>
      <Text numberOfLines={1} className="text-sm font-sans-semibold text-ink-50">
        {dateKey(entry.checkin.date)}
      </Text>
      {detail ? (
        <Text numberOfLines={2} className="text-xs text-ink-400">
          {detail}
        </Text>
      ) : null}
    </View>
  );
};
