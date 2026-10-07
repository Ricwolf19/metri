import { Text, View } from 'react-native';

import { Input } from '@/components/ui';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { LoadSectionLabel } from './LoadSectionLabel';
import { MachineLoadGrid } from './MachineLoadGrid';

/**
 * The stack mode of the weight sheet: base weight + increment describe the
 * machine, the pins come up as a grid, an odd stack goes in "other".
 * Presentational — the sheet owns the state and the arithmetic.
 */
export const MachineLoadForm = ({
  unit,
  baseText,
  onBaseText,
  incText,
  onIncText,
  pins,
  step,
  onPick,
  otherText,
  onOtherText,
}: {
  unit: Units;
  baseText: string;
  onBaseText: (text: string) => void;
  incText: string;
  onIncText: (text: string) => void;
  /** The loads on offer, in the display unit. */
  pins: number[];
  /** The selected pin, or null when "other" is in use. */
  step: number | null;
  onPick: (index: number) => void;
  otherText: string;
  onOtherText: (text: string) => void;
}) => {
  const t = useT();
  return (
    <>
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <Input
            label={t('load.machineBase')}
            rightSlot={<UnitSuffix label={unit} />}
            value={baseText}
            onChangeText={onBaseText}
            keyboardType="decimal-pad"
            placeholder="0"
            maxLength={6}
          />
        </View>
        <View className="flex-1">
          <Input
            label={t('load.machineIncrement')}
            rightSlot={<UnitSuffix label={unit} />}
            value={incText}
            onChangeText={onIncText}
            keyboardType="decimal-pad"
            placeholder="5"
            maxLength={6}
          />
        </View>
      </View>
      <LoadSectionLabel label={t('load.pickLoad')} />
      {/* The area is always there: the grid filling it must not shove the
          "other" field and the buttons down once the increment is typed. */}
      {pins.length ? (
        <MachineLoadGrid loads={pins} unit={unit} selected={step} onSelect={onPick} />
      ) : (
        <Text className="min-h-11 text-xs leading-4 text-ink-500">{t('load.pinsHint')}</Text>
      )}
      <View className="mt-4">
        <Input
          label={t('load.otherLoad')}
          rightSlot={<UnitSuffix label={unit} />}
          value={otherText}
          onChangeText={onOtherText}
          keyboardType="decimal-pad"
          placeholder="—"
          maxLength={6}
        />
      </View>
    </>
  );
};
