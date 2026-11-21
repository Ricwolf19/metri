import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons';
import { Input, SegmentedControl, UnitSuffix } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { rungOf } from '../../ladder';
import type { JumpText } from '../../load-sheet';
import { LoadSectionLabel } from './LoadSectionLabel';
import { LoadGrid } from './LoadGrid';
import { StepJumpsEditor } from './StepJumpsEditor';

type RackFields = {
  startText: string;
  onStartText: (text: string) => void;
  stepText: string;
  onStepText: (text: string) => void;
  jumps: JumpText[];
  onJumps: (next: JumpText[]) => void;
};

/**
 * The dumbbell mode of the weight sheet: ONE dumbbell picked off the gym's
 * rack (a grid, like a stack's pins — never a typed number, so the row always
 * names a dumbbell that exists), how many hands hold one, and the rack itself
 * behind "Edit rack" for a gym whose dumbbells go up differently. A kettlebell
 * keeps a typed field over the same grid. Presentational — the sheet owns the
 * state.
 */
export const DumbbellLoadForm = ({
  unit,
  perHandText,
  onPerHandText,
  weights,
  typed,
  missing,
  hands,
  onHands,
  rack,
}: {
  unit: Units;
  perHandText: string;
  onPerHandText: (text: string) => void;
  /** Every dumbbell on the rack, display unit, lightest first. */
  weights: number[];
  /** A typed field above the grid (kettlebells: their sizes are no rack's). */
  typed: boolean;
  /** No usable number yet: the form says what it needs. */
  missing: boolean;
  hands: 1 | 2;
  /** Absent: the exercise holds ONE dumbbell in both hands and there is nothing to choose. */
  onHands?: (hands: 1 | 2) => void;
  rack: RackFields;
}) => {
  const t = useT();
  const { muted } = useTheme();
  // Presentation only: the rack's fields live in the sheet's form either way.
  const [editingRack, setEditingRack] = useState(false);
  const picked = rungOf(weights, parseDecimal(perHandText));

  return (
    <>
      {typed ? (
        <View className="mt-4">
          <Input
            label={t('load.perHand')}
            rightSlot={<UnitSuffix label={unit} />}
            value={perHandText}
            onChangeText={onPerHandText}
            keyboardType="decimal-pad"
            maxLength={6}
            hint={missing ? t('load.needPerHand') : undefined}
          />
        </View>
      ) : null}
      <LoadSectionLabel label={t('load.dumbbellPresets')} first={!typed} />
      {!typed && missing ? (
        <Text className="mb-2 text-xs leading-4 text-ink-400">{t('load.pickDumbbell')}</Text>
      ) : null}
      <LoadGrid
        loads={weights}
        unit={unit}
        selected={picked}
        onSelect={(i) => onPerHandText(String(weights[i]))}
      />
      <Pressable
        onPress={() => setEditingRack((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: editingRack }}
        className="mt-2 min-h-11 flex-row items-center gap-1 self-start"
      >
        <Text
          maxFontSizeMultiplier={CONTROL_FONT_SCALE}
          className="text-xs font-sans-semibold text-ink-300 underline"
        >
          {t('load.editRack')}
        </Text>
        {editingRack ? (
          <ChevronUpIcon color={muted} size={12} />
        ) : (
          <ChevronDownIcon color={muted} size={12} />
        )}
      </Pressable>
      {editingRack ? (
        <View className="rounded-field border border-ink-700 px-3 pb-1 pt-3">
          <Text className="mb-3 text-xs leading-4 text-ink-400">{t('load.rackHint')}</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input
                label={t('load.rackStart')}
                rightSlot={<UnitSuffix label={unit} />}
                value={rack.startText}
                onChangeText={rack.onStartText}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
            <View className="flex-1">
              <Input
                label={t('load.rackStep')}
                rightSlot={<UnitSuffix label={unit} />}
                value={rack.stepText}
                onChangeText={rack.onStepText}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
          </View>
          <StepJumpsEditor
            unit={unit}
            jumps={rack.jumps}
            onChange={rack.onJumps}
            addLabel={t('load.addRackJump')}
          />
        </View>
      ) : null}
      {onHands ? (
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
      ) : (
        <Text className="mt-4 text-xs text-ink-500">{t('load.heldInBothHands')}</Text>
      )}
    </>
  );
};
