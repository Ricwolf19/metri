import { Pressable, Text, View } from 'react-native';

import { ChevronRightIcon, PlaySolidIcon } from '@/components/icons';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';

type Props = {
  name: string;
  /** Schedule label ("Mon · 18:00"), null when the split has no schedule. */
  label: string | null;
  /** A second line under the label: "Carried over from Monday". */
  note?: string | null;
  /** `next` = the large brand Play, the one split that can start; `other` = a compact read-only row. */
  emphasis: 'next' | 'other';
  disabled?: boolean;
  /** Resolved this program week: `done` greys it, `skipped` (legacy) marks it in the missed colour. */
  resolved?: 'done' | 'skipped' | null;
  /** Present on the split up next only. */
  onPlay?: () => void;
  /** Opens the read-only preview of the split's exercises. */
  onOpen: () => void;
};

/**
 * One split of the active program. Splits unlock in order: the one up next
 * carries the Play, every other one is a row that opens its exercises to read
 * — a chevron, never a Play, so a session can only start where the plan is.
 */
export const SplitRow = ({
  name,
  label,
  note = null,
  emphasis,
  disabled = false,
  resolved = null,
  onPlay,
  onOpen,
}: Props) => {
  const t = useT();
  const { brand, brandContrast, muted } = useTheme();
  const done = resolved !== null;
  const next = emphasis === 'next' && !done;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={name}
      className={
        next
          ? 'flex-row items-center rounded-field border border-brand/30 bg-brand/10 py-3 pl-4 pr-3'
          : done
            ? 'flex-row items-center rounded-field border border-ink-700 bg-ink-850/50 py-2.5 pl-4 pr-2.5'
            : 'flex-row items-center rounded-field border border-ink-600 bg-ink-850 py-2.5 pl-4 pr-2.5'
      }
    >
      <View className="min-w-0 flex-1">
        <Text
          className={
            next
              ? 'text-lg font-sans-bold text-ink-50'
              : done
                ? 'text-base font-sans-semibold text-ink-500'
                : 'text-base font-sans-semibold text-ink-50'
          }
        >
          {name}
        </Text>
        {resolved === 'skipped' ? (
          <Text className="mt-0.5 text-xs" style={{ color: MISSED }}>
            {t('training.skippedThisWeek')}
          </Text>
        ) : done ? (
          <Text className="mt-0.5 text-xs text-ink-500">{t('training.doneThisWeek')}</Text>
        ) : label ? (
          <Text className="mt-0.5 text-xs text-ink-400">{label}</Text>
        ) : null}
        {note && !done ? <Text className="mt-0.5 text-xs text-info">{note}</Text> : null}
      </View>
      {next && onPlay ? (
        <Pressable
          onPress={onPlay}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={t('training.playSplit', { name })}
          className={[
            'h-14 w-14 items-center justify-center rounded-full bg-brand',
            disabled ? 'opacity-40' : '',
          ].join(' ')}
        >
          <PlaySolidIcon color={brandContrast} size={24} />
        </Pressable>
      ) : (
        <ChevronRightIcon color={done ? muted : brand} size={18} />
      )}
    </Pressable>
  );
};
