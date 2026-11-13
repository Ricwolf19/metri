import { Text, View } from 'react-native';

import { BadgeRow } from '@/components/ui';
import { useI18n, useT } from '@/i18n';

import { setGroupLine } from '../labels';
import { badgeDetail, badgeLabel } from '../programs/badge-copy';
import type { SplitPreviewRow } from '../session.repo';
import { formatRest } from '../session-timeline';

/**
 * A split's exercises as a session would open them, to READ: the name, each
 * set group with its effort, the rest and the cues (a pause spelled out, as on
 * the session card). The Train tab's preview of a split not up yet and a
 * program's quick view both draw it.
 */
export const SplitExercises = ({ rows }: { rows: SplitPreviewRow[] }) => {
  const t = useT();
  const { locale } = useI18n();
  if (!rows.length) {
    return <Text className="text-center text-sm text-ink-400">{t('training.empty')}</Text>;
  }
  return (
    <View className="gap-2">
      {rows.map((row, i) => {
        const multi = row.groups.length > 1;
        return (
          <View
            key={`${row.exerciseId}-${i}`}
            className="flex-row gap-3 rounded-field bg-ink-850 px-3 py-3"
          >
            <Text className="w-5 pt-0.5 font-mono-medium text-xs text-ink-500">{i + 1}</Text>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-sans-semibold text-ink-100">{row.name}</Text>
              {row.groups.map((g, gi) => (
                <Text key={gi} className="mt-1 font-mono-medium text-xs text-ink-300">
                  {setGroupLine(
                    g,
                    multi ? (gi === 0 ? t('training.topSet') : t('training.backOff')) : null,
                    t,
                  )}
                </Text>
              ))}
              {row.restSeconds ? (
                <Text className="mt-1 text-xs text-ink-400">
                  {t('training.rest')} {formatRest(row.restSeconds)}
                </Text>
              ) : null}
              {row.badges.length ? (
                <View className="mt-2">
                  <BadgeRow
                    mono
                    tone="brand"
                    items={row.badges.map((b, bi) => {
                      const detail = badgeDetail(b, locale);
                      const label = badgeLabel(b, locale);
                      return detail
                        ? {
                            value: `${b}-${bi}`,
                            label: `${label} · ${detail}`,
                            tone: 'info' as const,
                          }
                        : { value: `${b}-${bi}`, label };
                    })}
                  />
                </View>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
};
