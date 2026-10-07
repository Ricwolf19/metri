import { Pressable, Text, View } from 'react-native';

import { BarGraphic } from '@/components/BarGraphic';
import { ChipRow, Input, ScrollRow } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { stackPlates } from '@/features/training/load';
import { plateOptions } from '@/features/training/plate-math';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { LoadSectionLabel } from './LoadSectionLabel';
import { PlateStackRow } from './PlateStackRow';

/**
 * The bar + plates mode of the weight sheet: pick the bar, tap plates onto ONE
 * side (the other matches), see the loaded bar, or type the per-side load.
 * Presentational — the sheet owns the state and the arithmetic.
 */
export const BarbellLoadForm = ({
  unit,
  barItems,
  barId,
  onBar,
  hasBar,
  plates,
  plateSum,
  onAddPlate,
  onRemovePlate,
  sideText,
  onSideText,
}: {
  unit: Units;
  barItems: { value: string; label: string }[];
  barId: string;
  onBar: (id: string) => void;
  hasBar: boolean;
  /** One side, in the display unit. */
  plates: number[];
  plateSum: number;
  onAddPlate: (plate: number) => void;
  onRemovePlate: (plate: number) => void;
  sideText: string;
  onSideText: (text: string) => void;
}) => {
  const t = useT();
  const stack = stackPlates(plates);
  return (
    <>
      <LoadSectionLabel label={t('training.bar')} />
      <ChipRow items={barItems} value={barId} onChange={onBar} />
      <View className="mt-4">
        <BarGraphic plates={stack} bar={hasBar} />
      </View>
      <LoadSectionLabel label={t('training.plates')} />
      {/* A side can hold several plates of one size (2 × 20), so an option
          always ADDS one; the stack below is where one comes off. */}
      <ScrollRow>
        {plateOptions(unit).map((p) => (
          <Pressable
            key={p}
            onPress={() => onAddPlate(p)}
            accessibilityRole="button"
            accessibilityLabel={`${p} ${unit}`}
            className="shrink-0 rounded-full border border-ink-700 bg-ink-800 px-3.5 py-2"
          >
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="text-sm font-sans-semibold text-ink-300"
            >
              +{p} {unit}
            </Text>
          </Pressable>
        ))}
      </ScrollRow>
      {stack.length ? (
        <View className="mt-3">
          <PlateStackRow stack={stack} unit={unit} onAdd={onAddPlate} onRemove={onRemovePlate} />
        </View>
      ) : null}
      <View className="mt-4">
        <Input
          label={t('training.perSide')}
          rightSlot={<UnitSuffix label={unit} />}
          value={sideText}
          onChangeText={onSideText}
          keyboardType="decimal-pad"
          placeholder={String(plateSum)}
          maxLength={6}
        />
      </View>
    </>
  );
};
