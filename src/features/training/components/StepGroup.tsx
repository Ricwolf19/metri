import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

type Props = {
  /** What this pair changes, e.g. "Weight · kg". */
  label: string;
  step: number;
  onStepChange: (step: number) => void;
  onBump: (delta: number) => void;
};

/**
 * Steps beyond ten are faster to type than to tap, so the picker stops there
 * and the keyboard takes over.
 */
const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const BTN = 'h-9 flex-1 items-center justify-center rounded-field border border-ink-700 bg-ink-800';

/**
 * A −/+ pair that says what it changes and how much by.
 *
 * Four identical chips reading -5 +5 -1 +1 gave no clue which pair was the
 * weight, so each pair is captioned and shows its own step between the
 * buttons. Holding either button unlocks that step: the row becomes a strip of
 * sizes, and picking one locks it back in. The step is remembered, because a
 * lifter's plate jump does not change between sets.
 */
export const StepGroup = ({ label, step, onStepChange, onBump }: Props) => {
  const t = useT();
  const { brand, muted } = useTheme();
  const [picking, setPicking] = useState(false);

  return (
    <View className="flex-1">
      <Text
        numberOfLines={1}
        className="mb-1 text-center font-mono-medium text-[9px] uppercase tracking-wider text-ink-500"
      >
        {label}
      </Text>

      {picking ? (
        <View className="h-9 justify-center">
          <ScrollRow className="gap-1">
            {STEPS.map((n) => (
              <Pressable
                key={n}
                onPress={() => {
                  onStepChange(n);
                  setPicking(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: n === step }}
                className={[
                  'h-8 w-8 shrink-0 items-center justify-center rounded-field border',
                  n === step ? 'border-brand/50 bg-brand/15' : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-xs font-sans-semibold',
                    n === step ? 'text-brand' : 'text-ink-300',
                  ].join(' ')}
                >
                  {n}
                </Text>
              </Pressable>
            ))}
          </ScrollRow>
        </View>
      ) : (
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => onBump(-step)}
            onLongPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`${label} −${step}`}
            accessibilityHint={t('training.stepHint')}
            className={BTN}
          >
            <MinusIcon color={muted} size={15} />
          </Pressable>

          <Pressable
            onPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={t('training.stepSize', { n: step })}
            className="h-9 w-8 items-center justify-center"
          >
            <Text className="text-xs font-sans-bold text-brand">{step}</Text>
          </Pressable>

          <Pressable
            onPress={() => onBump(step)}
            onLongPress={() => setPicking(true)}
            accessibilityRole="button"
            accessibilityLabel={`${label} +${step}`}
            accessibilityHint={t('training.stepHint')}
            className={BTN}
          >
            <PlusIcon color={brand} size={15} />
          </Pressable>
        </View>
      )}
    </View>
  );
};
