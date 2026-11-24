import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { XIcon } from '@/components/icons';
import { Button, Input, ScrollRow, UnitSuffix } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { inputCap } from '../../load';

/** The odd dumbbells the rack holds besides its steps, and how they come and go. */
export type RackExtras = {
  /** Display unit, lightest first. */
  weights: readonly number[];
  onAdd: (weight: number) => void;
  onRemove: (weight: number) => void;
};

/**
 * "Add a dumbbell": the odd dumbbell a gym has that the rack's steps miss (a
 * 12 lb on a rack of 5s) — a field and Add, then the ones added as chips, each
 * removed with its ×. The sheet writes them to the rack at once; this box only
 * holds the number being typed.
 */
export const RackExtrasEditor = ({ unit, extras }: { unit: Units; extras: RackExtras }) => {
  const t = useT();
  const { muted } = useTheme();
  const [text, setText] = useState('');
  const weight = parseDecimal(text);
  const canAdd = weight != null && weight > 0 && weight <= inputCap('perHand', unit);
  const add = () => {
    if (!canAdd) return;
    extras.onAdd(weight);
    setText('');
  };

  return (
    <View className="rounded-field border border-ink-700 px-3 pb-3 pt-3">
      <Text className="mb-3 text-xs leading-4 text-ink-400">{t('load.extraHint')}</Text>
      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <Input
            label={t('load.extraWeight')}
            rightSlot={<UnitSuffix label={unit} />}
            value={text}
            onChangeText={setText}
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={add}
            maxLength={6}
          />
        </View>
        {/* Wrapped: the row aligns this box to the field's bottom edge,
            while a button that is not full-width aligns itself to the top. */}
        <View>
          <Button
            variant="brandSoft"
            fullWidth={false}
            label={t('load.addExtra')}
            disabled={!canAdd}
            onPress={add}
          />
        </View>
      </View>
      {extras.weights.length ? (
        <View className="mt-3">
          <ScrollRow className="gap-2">
            {extras.weights.map((w) => (
              <Pressable
                key={w}
                onPress={() => extras.onRemove(w)}
                accessibilityRole="button"
                accessibilityLabel={t('load.removeExtra', { weight: w, unit })}
                className="min-h-11 shrink-0 flex-row items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800 pl-3 pr-2.5 active:bg-ink-700"
              >
                <Text
                  maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                  className="text-sm font-sans-semibold tabular-nums text-ink-200"
                >
                  {w} {unit}
                </Text>
                <XIcon color={muted} size={14} />
              </Pressable>
            ))}
          </ScrollRow>
        </View>
      ) : null}
    </View>
  );
};
