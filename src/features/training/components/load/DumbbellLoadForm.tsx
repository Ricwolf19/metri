import { Pressable, Text, View } from 'react-native';

import { Input, ScrollRow, SegmentedControl } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import { LoadSectionLabel } from './LoadSectionLabel';

/**
 * The dumbbell mode of the weight sheet: ONE dumbbell's weight, the rack's
 * common weights as presets under it, and how many hands hold one.
 * Presentational — the sheet owns the state.
 */
export const DumbbellLoadForm = ({
  unit,
  perHandText,
  onPerHandText,
  presets,
  missing,
  hands,
  onHands,
}: {
  unit: Units;
  perHandText: string;
  onPerHandText: (text: string) => void;
  /** The rack's usual weights in the display unit (2.5 kg / 5 lb steps). */
  presets: number[];
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
      <LoadSectionLabel label={t('load.dumbbellPresets')} />
      <ScrollRow>
        {presets.map((p) => {
          const on = perHandText === String(p);
          return (
            <Pressable
              key={p}
              onPress={() => onPerHandText(String(p))}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              className={[
                'min-h-10 shrink-0 items-center justify-center rounded-full border px-3',
                on ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
              ].join(' ')}
            >
              <Text
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                className={[
                  'text-sm font-sans-semibold tabular-nums',
                  on ? 'text-brand' : 'text-ink-300',
                ].join(' ')}
              >
                {p}
              </Text>
            </Pressable>
          );
        })}
      </ScrollRow>
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
