import { Pressable, Text, View } from 'react-native';

import { ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import type { ProgressPose } from '@/db/schema';
import { dateFromKey } from '@/features/training/dates';
import { useT } from '@/i18n';
import { useDateFormat } from '@/lib/useDateFormat';

import { photoForPose, type CheckinEntry } from '../checkins';
import { MediaThumb } from './MediaThumb';

/**
 * The comparison's check-ins as a sideways strip (oldest first): the pose's
 * thumbnail over the date. A pick wears its mark — the before/after letter,
 * or its place in the grid — so the choice never rests on the border colour.
 */
export const ComparePicker = ({
  entries,
  pose,
  marks,
  onPick,
}: {
  entries: readonly CheckinEntry[];
  pose: ProgressPose;
  /** Check-in id → what its badge says ("B", "A", "1"…); absent = not picked. */
  marks: ReadonlyMap<string, string>;
  onPick: (checkinId: string) => void;
}) => {
  const t = useT();
  const { dayMonth } = useDateFormat();
  return (
    <ScrollRow>
      {entries.map((entry) => {
        const photo = photoForPose(entry, pose);
        if (!photo) return null;
        const mark = marks.get(entry.checkin.id);
        const date = dayMonth(dateFromKey(entry.checkin.date));
        return (
          <Pressable
            key={entry.checkin.id}
            onPress={() => onPick(entry.checkin.id)}
            accessibilityRole="button"
            accessibilityLabel={t('compare.checkinA11y', { date })}
            accessibilityState={{ selected: mark !== undefined }}
            className="w-16 shrink-0"
          >
            <View
              className={[
                'rounded-field border-2',
                mark !== undefined ? 'border-brand' : 'border-transparent',
              ].join(' ')}
            >
              <MediaThumb media={photo} />
            </View>
            {mark !== undefined ? (
              <View className="absolute right-1 top-1 min-h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1">
                <Text
                  maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                  className="text-[10px] font-sans-bold text-ink-950"
                >
                  {mark}
                </Text>
              </View>
            ) : null}
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="mt-1 text-center text-xs text-ink-300"
            >
              {date}
            </Text>
          </Pressable>
        );
      })}
    </ScrollRow>
  );
};
