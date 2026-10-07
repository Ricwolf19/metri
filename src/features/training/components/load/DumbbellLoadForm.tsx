import { View } from 'react-native';

import { Input, SegmentedControl } from '@/components/ui';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

/**
 * The dumbbell mode of the weight sheet: ONE dumbbell's weight and how many
 * hands hold one. Presentational — the sheet owns the state.
 */
export const DumbbellLoadForm = ({
  unit,
  perHandText,
  onPerHandText,
  missing,
  hands,
  onHands,
}: {
  unit: Units;
  perHandText: string;
  onPerHandText: (text: string) => void;
  /** No usable number yet: the field explains what it needs. */
  missing: boolean;
  hands: 1 | 2;
  onHands: (hands: 1 | 2) => void;
}) => {
  const t = useT();
  return (
    <>
      <View className="mt-4">
        <Input
          label={t('load.perHand')}
          rightSlot={<UnitSuffix label={unit} />}
          value={perHandText}
          onChangeText={onPerHandText}
          keyboardType="decimal-pad"
          placeholder="0"
          maxLength={6}
          hint={missing ? t('load.needPerHand') : undefined}
        />
      </View>
      <View className="mt-4">
        <SegmentedControl
          segments={[
            { value: '1', label: t('load.oneDumbbell') },
            { value: '2', label: t('load.twoDumbbells') },
          ]}
          value={String(hands) as '1' | '2'}
          onChange={(v) => onHands(v === '1' ? 1 : 2)}
        />
      </View>
    </>
  );
};
