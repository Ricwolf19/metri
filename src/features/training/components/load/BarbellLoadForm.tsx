import { View } from 'react-native';

import { BarGraphic } from '@/components/BarGraphic';
import { ChipRow, Input, SegmentedControl } from '@/components/ui';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { stackPlates } from '@/features/training/load';
import { plateOptions } from '@/features/training/plate-math';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { LoadSectionLabel } from './LoadSectionLabel';
import { PlateBadgeRow } from './PlateBadgeRow';

/**
 * The plates mode of the weight sheet: pick the bar (or type a plate-loaded
 * machine's base), tap plates onto ONE side (the other matches), see the
 * loaded bar. Plates only — the free per-side field is gone: the live row
 * already takes the per-side number, and a typed number here saved no
 * picture, which is the one thing this sheet exists to save. Presentational —
 * the sheet owns the state and the arithmetic. The layout is fixed: the
 * graphic box never resizes and the rack is one row that counts in place, so
 * nothing the lifter is about to tap moves.
 */
export const BarbellLoadForm = ({
  unit,
  barItems,
  barId,
  onBar,
  base,
  sides,
  hasBar,
  plates,
  onAddPlate,
  onRemovePlate,
}: {
  unit: Units;
  barItems: { value: string; label: string }[];
  barId: string;
  onBar: (id: string) => void;
  /** A plate-loaded machine: its sled weight replaces the bar chips. */
  base?: { text: string; onText: (text: string) => void };
  /** A plate-loaded machine: plates on two horns (×2) or on one post (once). */
  sides?: { value: 1 | 2; onChange: (sides: 1 | 2) => void };
  hasBar: boolean;
  /** One side, in the display unit. */
  plates: number[];
  onAddPlate: (plate: number) => void;
  onRemovePlate: (plate: number) => void;
}) => {
  const t = useT();
  const stack = stackPlates(plates);
  const counts = new Map(stack.map(({ plate, count }) => [plate, count]));
  return (
    <>
      {base ? (
        <View className="mt-4 gap-3">
          <Input
            label={t('load.machineBase')}
            rightSlot={<UnitSuffix label={unit} />}
            value={base.text}
            onChangeText={base.onText}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={6}
          />
          {sides ? (
            <SegmentedControl
              segments={[
                { value: '2', label: t('load.platesPerSide') },
                { value: '1', label: t('load.platesOnePost') },
              ]}
              value={String(sides.value) as '1' | '2'}
              onChange={(v) => sides.onChange(v === '1' ? 1 : 2)}
            />
          ) : null}
        </View>
      ) : (
        <>
          <LoadSectionLabel label={t('training.bar')} />
          <ChipRow items={barItems} value={barId} onChange={onBar} />
        </>
      )}
      <View className="mt-4">
        <BarGraphic plates={stack} bar={!base && hasBar} mirror={!sides || sides.value === 2} />
      </View>
      <LoadSectionLabel label={t('training.plates')} />
      <PlateBadgeRow
        options={plateOptions(unit)}
        counts={counts}
        unit={unit}
        onAdd={onAddPlate}
        onRemove={onRemovePlate}
      />
    </>
  );
};
