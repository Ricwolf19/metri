import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from '@/components/icons';
import { Input, UnitSuffix } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { useT } from '@/i18n';
import { parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { rungOf } from '../../ladder';
import type { JumpText } from '../../load-sheet';
import { LoadSectionLabel } from './LoadSectionLabel';
import { LoadGrid } from './LoadGrid';
import { RackExtrasEditor, type RackExtras } from './RackExtrasEditor';
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
 * names a dumbbell that exists). The number is always one dumbbell: how many
 * the set moves is the exercise's, never asked here. Behind "Edit rack" the
 * rack itself, for a gym whose dumbbells go up differently; behind "Add a
 * dumbbell" the odd ones no step reaches (the 12 lb on a rack of 5s). A
 * kettlebell keeps a typed field over the same grid. Presentational — the
 * sheet owns the state.
 */
export const DumbbellLoadForm = ({
  unit,
  perHandText,
  onPerHandText,
  weights,
  typed,
  missing,
  rack,
  extras,
  expanded,
  onExpandedChange,
}: {
  unit: Units;
  perHandText: string;
  onPerHandText: (text: string) => void;
  /** Every dumbbell on the rack, display unit, lightest first (`rackWeights`). */
  weights: number[];
  /** A typed field above the grid (kettlebells: their sizes are no rack's). */
  typed: boolean;
  /** No usable number yet: the form says what it needs. */
  missing: boolean;
  rack: RackFields;
  extras: RackExtras;
  /** The rack shown in full ("Show more"), kept for the session by the sheet. */
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) => {
  const t = useT();
  const { brand, muted } = useTheme();
  // Presentation only: the rack's fields live in the sheet's form either way,
  // and an added dumbbell is written by the sheet the moment it is added.
  const [editingRack, setEditingRack] = useState(false);
  const [adding, setAdding] = useState(false);
  const current = parseDecimal(perHandText);
  const picked = rungOf(weights, current);

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
        near={current}
        expanded={expanded}
        onExpandedChange={onExpandedChange}
      />
      <View className="mt-2 flex-row flex-wrap items-center gap-x-5">
        <Pressable
          onPress={() => setEditingRack((open) => !open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: editingRack }}
          className="min-h-11 flex-row items-center gap-1"
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
        {/* A kettlebell's field takes any number; the odd sizes are a rack's. */}
        {typed ? null : (
          <Pressable
            onPress={() => setAdding((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: adding }}
            className="min-h-11 flex-row items-center gap-1"
          >
            <PlusIcon color={brand} size={14} />
            <Text
              maxFontSizeMultiplier={CONTROL_FONT_SCALE}
              className="text-xs font-sans-semibold text-brand"
            >
              {t('load.addDumbbell')}
            </Text>
          </Pressable>
        )}
      </View>
      {editingRack ? (
        <View
          className={[
            'rounded-field border border-ink-700 px-3 pb-1 pt-3',
            adding ? 'mb-2' : '',
          ].join(' ')}
        >
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
      {adding && !typed ? <RackExtrasEditor unit={unit} extras={extras} /> : null}
    </>
  );
};
