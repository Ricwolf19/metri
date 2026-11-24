import { Text, View } from 'react-native';

import { Input, UnitSuffix } from '@/components/ui';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import type { JumpText } from '../../load-sheet';
import { LoadSectionLabel } from './LoadSectionLabel';
import { LoadGrid } from './LoadGrid';
import { StepJumpsEditor } from './StepJumpsEditor';

/**
 * The stack mode of the weight sheet: base weight + plate weight describe the
 * machine, with the loads where its plates get heavier further down, and the
 * pins come up as a grid. Presentational — the sheet owns the state and the
 * arithmetic.
 */
export const MachineLoadForm = ({
  unit,
  baseText,
  onBaseText,
  incText,
  onIncText,
  jumps,
  onJumps,
  pins,
  step,
  onPick,
  near,
  expanded,
  onExpandedChange,
}: {
  unit: Units;
  baseText: string;
  onBaseText: (text: string) => void;
  incText: string;
  onIncText: (text: string) => void;
  jumps: JumpText[];
  onJumps: (next: JumpText[]) => void;
  /** The loads on offer, in the display unit. */
  pins: number[];
  /** The selected pin. */
  step: number | null;
  onPick: (index: number) => void;
  /** The row's number: with no pin picked, the collapsed pins open around it. */
  near: number | null;
  /** The pins shown in full ("Show more"), kept for the session by the sheet. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
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
            maxLength={6}
          />
        </View>
      </View>
      <StepJumpsEditor
        unit={unit}
        jumps={jumps}
        onChange={onJumps}
        addLabel={t('load.addStackJump')}
      />
      <LoadSectionLabel label={t('load.pickLoad')} />
      {/* The area is always there: the grid filling it must not shove the
          buttons down once the increment is typed. */}
      {pins.length ? (
        <LoadGrid
          loads={pins}
          unit={unit}
          selected={step}
          onSelect={onPick}
          near={near}
          expanded={expanded}
          onExpandedChange={onExpandedChange}
        />
      ) : (
        <Text className="min-h-11 text-xs leading-4 text-ink-500">{t('load.pinsHint')}</Text>
      )}
    </>
  );
};
