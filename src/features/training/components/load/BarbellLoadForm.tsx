import { View } from 'react-native';

import { BarGraphic } from '@/components/BarGraphic';
import { ChipRow, Input } from '@/components/ui';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { stackPlates } from '@/features/training/load';
import { plateOptions } from '@/features/training/plate-math';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { LoadSectionLabel } from './LoadSectionLabel';
import { PlateBadgeRow } from './PlateBadgeRow';

/**
 * The bar + plates mode of the weight sheet: pick the bar, tap plates onto ONE
 * side (the other matches), see the loaded bar, or type the per-side load.
 * Presentational — the sheet owns the state and the arithmetic. The layout is
 * fixed: the graphic box never resizes and the rack is one row that counts in
 * place, so nothing the lifter is about to tap moves.
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
  const counts = new Map(stack.map(({ plate, count }) => [plate, count]));
  return (
    <>
      <LoadSectionLabel label={t('training.bar')} />
      <ChipRow items={barItems} value={barId} onChange={onBar} />
      <View className="mt-4">
        <BarGraphic plates={stack} bar={hasBar} />
      </View>
      <LoadSectionLabel label={t('training.plates')} />
      <PlateBadgeRow
        options={plateOptions(unit)}
        counts={counts}
        unit={unit}
        onAdd={onAddPlate}
        onRemove={onRemovePlate}
      />
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
