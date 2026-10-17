import { Pressable, Text, View } from 'react-native';

import { CheckIcon, DumbbellIcon, SkipIcon, XIcon } from '@/components/icons';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import type { LoadDetail } from '../load';
import type { Trend } from '../set-prefill';
import type { RowDraft } from '../workout-drafts';
import { LoadBreakdown } from './LoadBreakdown';
import { SetInput } from './SetInput';

/** A plate-loaded row: the field holds the weight PER SIDE; the base is a tag. */
type SideInput = {
  /** The bar or sled weight in the display unit, as the tag shows it. */
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
  /** Mark this planned set as missed and move on (the card confirms first). */
  onSkip?: () => void;
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
 * The set being filled, on three lines. The header is ONE uppercase mono line
 * ("SET 1 | TARGET: 12 REPS @ FAILURE") that wraps rather than clips: the
 * header holds nothing else, so a long Spanish target still reads whole. Then
 * the two number fields with nothing beside them. Then the action line: the
 * base weight and the derived total with its plate breakdown on the left (the
 * data, free to wrap), Skip set in the middle, the calculator and the check on
 * the right. One line for everything clipped "132.5" behind a base prefix and
 * an arrow on a phone. The ± / RIR controls live once at the bottom of the
 * card and drive this row.
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
  onSkip,
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
      <View className="mb-2 flex-row items-start gap-2">
        <Text className="min-w-0 flex-1 font-mono-medium text-[11px] uppercase leading-4 tracking-wider text-brand">
          {label}
          {legend ? `  |  ${legend}` : ''}
        </Text>
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button">
            <XIcon color={muted} size={14} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row items-center gap-2">
        <View className="flex-1">
          <SetInput
            value={side ? side.value : draft.weight}
            onChangeText={side ? side.onChange : (weight) => onChange({ weight })}
            onBlur={onBlurWeight}
            unitLabel={unit}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={6}
            accessibilityLabel={
              side
                ? `${t(side.sides === 1 ? 'training.plates' : 'training.perSide')} (${unit})`
                : `${t('training.weight')} (${unit})`
            }
            trend={weightTrend}
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
            trend={repsTrend}
          />
        </View>
      </View>
      <View className="mt-2 flex-row items-center gap-2">
        <View className="min-h-5 min-w-0 flex-1 justify-center gap-0.5">
          {side ? (
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="font-mono-medium text-[10px] uppercase tracking-wider text-ink-400"
            >
              {t(side.sides === 1 ? 'training.platesTag' : 'training.baseTag', {
                n: side.baseLabel,
                unit,
              })}
            </Text>
          ) : null}
          {caption || breakdown ? (
            <View className="flex-row flex-wrap items-center gap-x-1.5">
              {caption ? <Text className="text-xs text-ink-400">{caption}</Text> : null}
              {caption && breakdown ? <Text className="text-xs text-ink-600">·</Text> : null}
              {breakdown ? <LoadBreakdown load={breakdown} unit={unit} /> : null}
            </View>
          ) : null}
        </View>
        {onSkip ? (
          <Pressable
            onPress={onSkip}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={t('training.skipSet')}
            className="h-10 shrink-0 items-center justify-center gap-0.5 rounded-field px-2"
          >
            <SkipIcon color={muted} size={16} />
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="text-[10px] font-sans-semibold text-ink-400"
            >
              {t('training.skipSet')}
            </Text>
          </Pressable>
        ) : null}
        {onOpenCalculator ? (
          <Pressable
            onPress={onOpenCalculator}
            accessibilityRole="button"
            accessibilityLabel={t('training.calculatorTitle')}
            className={[
              'h-10 w-10 shrink-0 items-center justify-center rounded-field border',
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
          className="h-10 w-12 shrink-0 items-center justify-center rounded-field bg-brand"
        >
          <CheckIcon color={brandContrast} size={22} />
        </Pressable>
      </View>
    </View>
  );
};
