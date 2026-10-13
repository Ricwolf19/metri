import { Pressable, Text, View } from 'react-native';

import { CheckIcon, DumbbellIcon, XIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import type { LoadDetail } from '../load';
import type { Trend } from '../set-prefill';
import type { RowDraft } from '../workout-drafts';
import { LoadBreakdown } from './LoadBreakdown';
import { SetInput } from './SetInput';
import { TrendArrow } from './TrendArrow';

/** A plate-loaded row: the field holds the weight PER SIDE beside a fixed base. */
type SideInput = {
  /** The bar or sled weight in the display unit, as the prefix shows it. */
  baseLabel: string;
  /** 2 = per side (two horns), 1 = every plate on one post. */
  sides: 1 | 2;
  value: string;
  onChange: (text: string) => void;
};

type Props = {
  label: string;
  legend: string | null;
  draft: RowDraft;
  unit: Units;
  placeholder: string;
  onChange: (patch: Partial<RowDraft>) => void;
  onConfirm: () => void;
  onRemove?: () => void;
  onOpenCalculator?: () => void;
  /** A load detail is saved for this exercise: the sheet icon says so in `info`. */
  detailActive?: boolean;
  /** Per-hand / total, or how the load is built — the row stays a plain number. */
  caption?: string | null;
  /** The detail the row currently describes, drawn as one compact line. */
  breakdown?: LoadDetail | null;
  /** How the typed values compare with the same set of the previous session. */
  weightTrend?: Trend | null;
  repsTrend?: Trend | null;
  /** Present on plate-loaded exercises: the weight field takes the per-side number. */
  side?: SideInput;
  /** The weight field lost focus: the card snaps the number onto the rack. */
  onBlurWeight?: () => void;
};

/**
 * The set being filled: number and prescription share the legend line so the
 * inputs get the full width, and the brand ring marks it as live. On a
 * plate-loaded exercise the weight field reads "20 + [22.5] kg" — the base as
 * a fixed prefix, the per-side load typed — and the derived total sits in the
 * caption, so the number in hand is always the one being loaded. The ± / RIR
 * controls live once at the bottom of the card and drive this row.
 */
export const ActiveSetRow = ({
  label,
  legend,
  draft,
  unit,
  placeholder,
  onChange,
  onConfirm,
  onRemove,
  onOpenCalculator,
  detailActive = false,
  caption,
  breakdown,
  weightTrend = null,
  repsTrend = null,
  side,
  onBlurWeight,
}: Props) => {
  const t = useT();
  const { brandContrast, muted, info } = useTheme();

  return (
    <View className="rounded-field border border-brand/40 bg-ink-850 px-3 py-2">
      <View className="mb-1.5 flex-row items-center">
        <Text className="text-xs font-sans-bold text-brand">{label}</Text>
        {legend ? (
          <Text className="ml-2 flex-1 font-mono-medium text-[10px] uppercase tracking-wider text-brand">
            {legend}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button">
            <XIcon color={muted} size={14} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row items-center gap-1.5">
        <View className="flex-1">
          <SetInput
            value={side ? side.value : draft.weight}
            onChangeText={side ? side.onChange : (weight) => onChange({ weight })}
            onBlur={onBlurWeight}
            unitLabel={unit}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={side ? 5 : 6}
            accessibilityLabel={
              side
                ? `${t(side.sides === 1 ? 'training.plates' : 'training.perSide')} (${unit})`
                : `${t('training.weight')} (${unit})`
            }
            leading={
              <>
                <TrendArrow trend={weightTrend} />
                {side ? (
                  <Text
                    className="self-center pl-2.5 text-base tabular-nums text-ink-400"
                    maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                  >
                    {side.baseLabel} +
                  </Text>
                ) : null}
              </>
            }
          />
        </View>
        <View className="flex-1">
          <SetInput
            value={draft.reps}
            onChangeText={(reps) => onChange({ reps })}
            unitLabel={t('training.repsShort')}
            keyboardType="number-pad"
            placeholder={placeholder}
            maxLength={3}
            accessibilityLabel={t('training.reps')}
            leading={<TrendArrow trend={repsTrend} />}
          />
        </View>
        {onOpenCalculator ? (
          <Pressable
            onPress={onOpenCalculator}
            accessibilityRole="button"
            accessibilityLabel={t('training.calculatorTitle')}
            className={[
              'h-12 w-10 items-center justify-center rounded-field border',
              detailActive ? 'border-info/40 bg-info/10' : 'border-ink-700 bg-ink-800',
            ].join(' ')}
          >
            <DumbbellIcon color={detailActive ? info : muted} size={18} />
          </Pressable>
        ) : null}
        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={t('training.addSet')}
          className="h-12 w-12 items-center justify-center rounded-field bg-brand"
        >
          <CheckIcon color={brandContrast} size={22} />
        </Pressable>
      </View>
      {caption || breakdown ? (
        <View className="mt-1.5 min-h-5 flex-row flex-wrap items-center gap-x-1.5">
          {caption ? <Text className="text-xs text-ink-400">{caption}</Text> : null}
          {caption && breakdown ? <Text className="text-xs text-ink-600">·</Text> : null}
          {breakdown ? <LoadBreakdown load={breakdown} unit={unit} /> : null}
        </View>
      ) : null}
    </View>
  );
};
