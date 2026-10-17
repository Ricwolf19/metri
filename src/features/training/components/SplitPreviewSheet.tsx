import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { PICKER_STOPS, ScrollArea, Sheet } from '@/components/ui';
import { useI18n, useT } from '@/i18n';

import { splitPreview } from '../session.repo';
import type { ScheduledDay } from '../schedule';

type Props = {
  /** The split to read, with the program week its prescription is for; null when closed. */
  split: { day: ScheduledDay; weekNumber: number; title: string; subtitle: string | null } | null;
  onClose: () => void;
};

/**
 * A split's exercises for this week, to read — not to start. Splits unlock in
 * order on the Train tab, and this is how the ones not up yet stay visible.
 */
export const SplitPreviewSheet = ({ split, onClose }: Props) => {
  const t = useT();
  const { locale } = useI18n();
  // Keyed on the id and week, not the object: the tab rebuilds `split` every render.
  const dayId = split?.day.id ?? null;
  const weekNumber = split?.weekNumber ?? 0;
  const rows = useMemo(
    () => (dayId ? splitPreview(dayId, weekNumber, locale) : []),
    [dayId, weekNumber, locale],
  );
  return (
    <Sheet visible={split !== null} onClose={onClose} snapPoints={PICKER_STOPS}>
      <ScrollArea inSheet>
        <Text className="text-lg font-sans-bold text-ink-50">{split?.title ?? ''}</Text>
        {split?.subtitle ? (
          <Text className="mt-1 text-sm text-ink-400">{split.subtitle}</Text>
        ) : null}
        <Text className="mt-1 text-xs text-ink-500">{t('training.previewHint')}</Text>
        <View className="mt-4 gap-2">
          {rows.map((row, i) => (
            <View
              key={`${row.exerciseId}-${i}`}
              className="flex-row items-center gap-3 rounded-field bg-ink-850 px-3 py-2.5"
            >
              <Text className="w-6 font-mono-medium text-xs text-ink-500">{i + 1}</Text>
              <Text className="min-w-0 flex-1 text-sm font-sans-medium text-ink-100">
                {row.name}
              </Text>
              <Text className="shrink-0 font-mono-medium text-xs text-ink-400">
                {row.sets} × {row.reps}
              </Text>
            </View>
          ))}
          {!rows.length ? (
            <Text className="text-center text-sm text-ink-400">{t('training.empty')}</Text>
          ) : null}
        </View>
      </ScrollArea>
    </Sheet>
  );
};
