import { Pressable, Text, View } from 'react-native';

import { PlaySolidIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';

type Props = {
  name: string;
  /** Schedule label ("Mon · 18:00"), null when the split has no schedule. */
  label: string | null;
  /** `today` = the large brand Play; `other` = the compact chip. */
  emphasis: 'today' | 'other';
  disabled: boolean;
  /** Resolved this program week: `done` greys it, `skipped` marks it in the missed colour. Both stay tappable (a warning upstream). */
  resolved?: 'done' | 'skipped' | null;
  onPlay: () => void;
  /** Offered while unresolved: "not this week" — the plan moves on without a session. */
  onSkip?: () => void;
};

/** One split of the active program with its Play control. */
export const SplitRow = ({
  name,
  label,
  emphasis,
  disabled,
  resolved = null,
  onPlay,
  onSkip,
}: Props) => {
  const t = useT();
  const { brand, brandContrast, muted } = useTheme();
  const done = resolved !== null;
  const today = emphasis === 'today' && !done;

  return (
    <View
      className={
        today
          ? 'flex-row items-center rounded-field border border-brand/30 bg-brand/10 py-3 pl-4 pr-3'
          : done
            ? 'flex-row items-center rounded-field border border-ink-700 bg-ink-850/50 py-2.5 pl-4 pr-2.5'
            : 'flex-row items-center rounded-field border border-ink-600 bg-ink-850 py-2.5 pl-4 pr-2.5'
      }
    >
      <View className="flex-1">
        <Text
          className={
            today
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
      </View>
      {onSkip && !done ? (
        <Pressable
          onPress={onSkip}
          disabled={disabled}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={t('training.skipSplit')}
          className={['mr-2 px-2 py-1', disabled ? 'opacity-40' : ''].join(' ')}
        >
          <Text
            maxFontSizeMultiplier={CONTROL_FONT_SCALE}
            className="text-xs font-sans-semibold text-ink-400 underline"
          >
            {t('training.skipAction')}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onPlay}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={t('training.playSplit', { name })}
        className={[
          'items-center justify-center rounded-full',
          today ? 'h-14 w-14 bg-brand' : done ? 'h-10 w-10 bg-ink-800' : 'h-10 w-10 bg-brand/15',
          disabled ? 'opacity-40' : '',
        ].join(' ')}
      >
        <PlaySolidIcon
          color={today ? brandContrast : done ? muted : brand}
          size={today ? 24 : 16}
        />
      </Pressable>
    </View>
  );
};
