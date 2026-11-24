import { useMemo, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ControlledInput, useOpenKey, useSaveForm } from '@/components/form';
import { Button, ChipRow, SHEET_GUTTER, Sheet, SheetForm, UnitSuffix } from '@/components/ui';
import type { Equipment } from '@/db/schema';
import { useT } from '@/i18n';
import { formatNumber, parseDecimal } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import { addRackExtra, dumbbellRack, removeRackExtra, saveRackLadder } from '../dumbbell-rack';
import { rungOf } from '../ladder';
import { loadModesFor, rackWeights, unitToKg, type LoadDetail, type LoadMode } from '../load';
import {
  parseJumpTexts,
  seedLoadSheet,
  sheetPins,
  sheetRack,
  untouchedStack,
  type LoadSheetValues,
} from '../load-sheet';
import {
  addPlate,
  barsFor,
  barInUnit,
  barLabel,
  equivalentIn,
  platesToSide,
  removePlate,
  totalFromSide,
} from '../plate-math';
import { useGridExpanded } from '../workout-drafts';
import { BarbellLoadForm } from './load/BarbellLoadForm';
import { DumbbellLoadForm } from './load/DumbbellLoadForm';
import { LoadSectionLabel } from './load/LoadSectionLabel';
import { MachineLoadForm } from './load/MachineLoadForm';

type LoadApply = {
  /**
   * The row's new number (display unit: a total, or ONE dumbbell) and how it
   * was built (kg, null for a plain number). Null leaves the row as it was: an
   * untouched open, or a stack described before any pin is picked.
   */
  row: { weightText: string; load: LoadDetail | null } | null;
  /** What to remember on the exercise (seeds the next open); null when nothing changed. */
  save: LoadDetail | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  unit: Units;
  /** The row's current weight draft (display unit). */
  initialWeight: string;
  /** The row's own detail, else the exercise's last-used config (kg). */
  initialLoad: LoadDetail | null;
  equipment: Equipment | null;
  /**
   * How many dumbbells a set of this exercise moves (`defaultHands`): one on a
   * unilateral lift or one held in both hands, else a pair. The exercise's
   * fact — the sheet never asks, and the number it takes is always ONE.
   */
  hands: 1 | 2;
  /**
   * The session the sheet opened in: a weight grid shown in full stays so on
   * every open until it ends (`useGridExpanded`). Absent, the grids open folded.
   */
  workoutLogId?: string;
  /** The mode to open in when the equipment offers several (the machine chooser). */
  preferMode?: LoadMode;
  onApply: (result: LoadApply) => void;
};

const num = parseDecimal;

/**
 * The weight sheet, shaped by how the exercise is loaded: a bar takes plates
 * per side (and remembers which bar; a plate-loaded machine types its base
 * instead), a stack takes a base + increment and offers the pins as badges,
 * dumbbells take ONE dumbbell off the gym's rack. The sheet works in the
 * DISPLAY unit end to end (see plate-math) and converts once at Apply; an open
 * that leaves every field as it was → Apply returns the row's text as-is.
 */
export const WeightCalculatorSheet = ({ visible, onClose, ...props }: Props) => {
  // The sheet stays mounted between opens; the form inside starts over on
  // every open — otherwise it reopened on the first row's numbers.
  const openKey = useOpenKey(visible);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <LoadSheetForm key={openKey} onClose={onClose} {...props} />
    </Sheet>
  );
};

const LoadSheetForm = ({
  onClose,
  unit,
  initialWeight,
  initialLoad,
  equipment,
  hands,
  workoutLogId,
  preferMode,
  onApply,
}: Omit<Props, 'visible'>) => {
  const t = useT();
  const [savedRack] = useState(() => dumbbellRack(unit));
  // The odd dumbbells are written the moment they are added or removed (the
  // gym's fact, kept even if the sheet is cancelled); this is the open sheet's copy.
  const [extras, setExtras] = useState<readonly number[]>(() => savedRack.extras ?? []);
  const [seed] = useState(() =>
    seedLoadSheet({ unit, initialWeight, initialLoad, equipment, preferMode, rack: savedRack }),
  );
  const [rackOpen, setRackOpen] = useGridExpanded(workoutLogId, 'rack');
  const [pinsOpen, setPinsOpen] = useGridExpanded(workoutLogId, 'pins');
  /** A machine marked as plates carries its sled weight where a bar would go. */
  const plateMachine = equipment === 'machine';

  // `isDirty` is "the lifter changed something": a field put back where it
  // opened (a plate added then removed, the chosen chip tapped again) is no
  // change, so Apply hands back the row's text verbatim — a total the sheet
  // cannot split (below the bar, not a number) must not come back as the bar
  // weight — and nothing is saved on the exercise.
  const form = useSaveForm<LoadSheetValues>({
    kind: 'create',
    defaultValues: seed,
    onSave: (values) => {
      // The rack is the gym's, not the exercise's: a device setting, written here.
      const typedRack = sheetRack(values);
      if (form.isDirty && values.mode === 'dumbbell' && typedRack.step > 0 && rackChanged(values))
        saveRackLadder(unit, typedRack);
      onApply(build(values));
      onClose();
    },
  });
  const v = useWatch({ control: form.control }) as LoadSheetValues;
  const set =
    <K extends keyof LoadSheetValues>(key: K) =>
    (value: LoadSheetValues[K]) =>
      form.setValue(key, value as never, { shouldDirty: true });

  /* ── Plates ──────────────────────────────────────────────────────────── */
  const bar = barsFor(unit).find((b) => b.id === v.barId) ?? barsFor(unit)[0];
  const sledWeight = num(v.sledText) ?? 0;
  const baseWeight = plateMachine ? sledWeight : barInUnit(bar, unit);
  const side = platesToSide(v.plates);
  const barbellTotal = totalFromSide(side, baseWeight, plateMachine ? v.sides : 2);
  const barItems = useMemo(
    () =>
      barsFor(unit).map((b) => ({
        value: b.id,
        label: b.kg === 0 ? t('training.barNone') : `${barLabel(b, unit)} ${unit}`,
      })),
    [t, unit],
  );
  // From the live value, not the render's: two quick taps must both land.
  const onAddPlate = (p: number) => set('plates')(addPlate(form.getValues('plates'), p));
  const onRemovePlate = (p: number) => set('plates')(removePlate(form.getValues('plates'), p));

  /* ── Stack ───────────────────────────────────────────────────────────── */
  const base = num(v.baseText) ?? 0;
  const inc = num(v.incText) ?? 0;
  const pins = sheetPins(v, unit, untouchedStack(v, seed, initialLoad));
  const machineTotal = v.step != null ? (pins[v.step] ?? 0) : 0;
  // A described stack is worth keeping before any pin is picked: Apply then
  // saves the machine, and the row's field picks the pin from it next.
  const stackOnly = v.mode === 'machine' && inc > 0 && v.step == null;

  /* ── Dumbbell ────────────────────────────────────────────────────────── */
  // The number is ONE dumbbell, and so is what the sheet shows: a pair is
  // counted twice in volume, never asked about nor doubled here.
  const perHand = num(v.perHandText);
  // A kettlebell shares the mode (one weight, typed) but is no dumbbell to name.
  const dumbbells = v.mode === 'dumbbell' && equipment !== 'kettlebell';
  const editedRack = sheetRack(v);
  // A rack mid-edit (no step yet) keeps showing the saved one rather than nothing.
  const rack = editedRack.step > 0 ? editedRack : savedRack;
  const weights = rackWeights({ ...rack, extras }, unit);
  // An odd dumbbell joins the rack at once and is the one picked: the lifter
  // just named the dumbbell in hand. One the rack already holds is only picked.
  const addExtra = (weight: number) => {
    if (rungOf(weights, weight) == null) setExtras(addRackExtra(unit, weight));
    set('perHandText')(formatNumber(weight));
  };
  const removeExtra = (weight: number) => {
    setExtras(removeRackExtra(unit, weight));
    // The dumbbell in hand just left the rack: pick again, or Apply would log
    // one the gym no longer has (picked, never typed).
    if (perHand != null && Math.abs(perHand - weight) <= 0.01) set('perHandText')('');
  };
  const rackChanged = (values: LoadSheetValues): boolean =>
    values.rackStartText !== seed.rackStartText ||
    values.rackStepText !== seed.rackStepText ||
    JSON.stringify(values.rackJumps) !== JSON.stringify(seed.rackJumps);

  const total =
    v.mode === 'barbell'
      ? barbellTotal
      : v.mode === 'machine'
        ? machineTotal
        : v.mode === 'dumbbell'
          ? (perHand ?? 0)
          : (num(v.plainText) ?? 0);

  // Every mode but the plain number must leave with a complete picture: that
  // picture is what the sheet saves, a half-described stack saves nothing.
  const canApply = v.mode === 'dumbbell' ? perHand != null : v.mode === 'machine' ? inc > 0 : true;

  const build = (values: LoadSheetValues): LoadApply => {
    if (!form.isDirty) return { row: null, save: null };
    if (values.mode === 'barbell') {
      const load: LoadDetail = {
        kind: 'barbell',
        barKg: plateMachine ? unitToKg(sledWeight, unit) : bar.kg,
        platesKg: values.plates.map((p) => unitToKg(p, unit)),
        ...(plateMachine && values.sides === 1 ? { sides: 1 as const } : {}),
      };
      return { row: { weightText: String(barbellTotal), load }, save: load };
    }
    if (values.mode === 'machine') {
      const jumps = parseJumpTexts(values.jumps).map((j) => ({
        fromKg: unitToKg(j.from, unit),
        incrementKg: unitToKg(j.step, unit),
      }));
      // An untouched stack saves as it was: its fields are rounded in the other unit.
      const kept = untouchedStack(values, seed, initialLoad);
      const load: LoadDetail = kept
        ? { ...kept, steps: values.step ?? 0 }
        : {
            kind: 'machine',
            baseKg: unitToKg(base, unit),
            incrementKg: unitToKg(inc, unit),
            steps: values.step ?? 0,
            ...(jumps.length ? { jumps } : {}),
          };
      return values.step == null
        ? { row: null, save: load }
        : { row: { weightText: String(machineTotal), load }, save: load };
    }
    if (values.mode === 'dumbbell') {
      const kg = unitToKg(perHand ?? 0, unit);
      const load: LoadDetail = { kind: 'dumbbell', perHandKg: kg, hands };
      return { row: { weightText: String(perHand ?? ''), load }, save: load };
    }
    return { row: { weightText: values.plainText, load: null }, save: null };
  };

  const modes = loadModesFor(equipment, initialLoad);
  const modeLabel: Record<LoadMode, string> = {
    barbell: plateMachine ? t('load.machinePlates') : t('load.kindBarbell'),
    machine: plateMachine ? t('load.machineStack') : t('load.kindMachine'),
    dumbbell: t('load.kindDumbbell'),
    none: t('load.kindNone'),
  };
  const modeItems = modes.map((value) => ({ value, label: modeLabel[value] }));

  return (
    // Scrolls only when a small screen (or the keyboard) cannot fit the form;
    // the sheet itself grows to show every field and both buttons.
    <SheetForm>
      <Text className="mb-1 text-lg font-sans-bold text-ink-50">
        {dumbbells ? t('load.dumbbellTitle') : t('training.calculatorTitle')}
      </Text>
      <Text className="mb-4 text-sm leading-5 text-ink-400">{t('load.sheetHint')}</Text>

      {modes.length > 1 ? (
        <>
          <LoadSectionLabel
            label={plateMachine ? t('load.machineKindTitle') : t('load.kind')}
            first
          />
          <ChipRow items={modeItems} value={v.mode} onChange={set('mode')} bleed={SHEET_GUTTER} />
        </>
      ) : null}

      {v.mode === 'barbell' ? (
        <BarbellLoadForm
          unit={unit}
          barItems={barItems}
          barId={v.barId}
          onBar={set('barId')}
          base={plateMachine ? { text: v.sledText, onText: set('sledText') } : undefined}
          sides={plateMachine ? { value: v.sides, onChange: set('sides') } : undefined}
          hasBar={bar.kg > 0}
          plates={v.plates}
          onAddPlate={onAddPlate}
          onRemovePlate={onRemovePlate}
        />
      ) : null}

      {v.mode === 'machine' ? (
        <MachineLoadForm
          unit={unit}
          baseText={v.baseText}
          onBaseText={set('baseText')}
          incText={v.incText}
          onIncText={(text) => {
            set('incText')(text);
            set('step')(null);
          }}
          jumps={v.jumps}
          onJumps={(next) => {
            set('jumps')(next);
            set('step')(null);
          }}
          pins={pins}
          step={v.step}
          onPick={set('step')}
          near={num(initialWeight)}
          expanded={pinsOpen}
          onExpandedChange={setPinsOpen}
        />
      ) : null}

      {v.mode === 'dumbbell' ? (
        <DumbbellLoadForm
          unit={unit}
          perHandText={v.perHandText}
          onPerHandText={set('perHandText')}
          weights={weights}
          typed={equipment !== 'dumbbell'}
          missing={perHand == null}
          rack={{
            startText: v.rackStartText,
            onStartText: set('rackStartText'),
            stepText: v.rackStepText,
            onStepText: set('rackStepText'),
            jumps: v.rackJumps,
            onJumps: set('rackJumps'),
          }}
          extras={{ weights: extras, onAdd: addExtra, onRemove: removeExtra }}
          expanded={rackOpen}
          onExpandedChange={setRackOpen}
        />
      ) : null}

      {v.mode === 'none' ? (
        <View className="mt-4">
          <ControlledInput
            control={form.control}
            name="plainText"
            label={t('training.weight')}
            rightSlot={<UnitSuffix label={unit} />}
            keyboardType="decimal-pad"
            maxLength={6}
          />
        </View>
      ) : null}

      <View className="mt-5 rounded-field bg-ink-800 px-4 py-3">
        <View className="flex-row items-baseline justify-between">
          <Text className="min-w-0 flex-1 pr-3 text-sm text-ink-400">
            {!dumbbells
              ? t(v.mode === 'dumbbell' ? 'training.weight' : 'training.total')
              : hands === 2
                ? t('load.eachDumbbell')
                : t('load.perHand')}
          </Text>
          <Text className="shrink-0 text-2xl font-sans-bold tabular-nums text-ink-50">
            {total} {unit}
          </Text>
        </View>
        <Text className="mt-0.5 text-right text-xs text-ink-500">
          {t('training.totalEquivalent', {
            value: equivalentIn(total, unit),
            unit: unit === 'kg' ? 'lb' : 'kg',
          })}
        </Text>
        {v.mode !== 'none' ? (
          <Text className="mt-1.5 text-xs text-ink-500">{t('load.savedHint')}</Text>
        ) : null}
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1">
          <Button variant="secondary" label={t('common.cancel')} onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button
            variant="brand"
            label={stackOnly ? t('load.saveStack') : t('training.applyWeight')}
            disabled={!canApply || !form.canSave}
            onPress={() => form.submit()}
          />
        </View>
      </View>
    </SheetForm>
  );
};
