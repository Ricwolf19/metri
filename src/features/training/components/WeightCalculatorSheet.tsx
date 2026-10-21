import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, ChipRow, Input, ScrollArea, Sheet } from '@/components/ui';
import type { Equipment } from '@/db/schema';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { useT } from '@/i18n';
import { parseDecimal, trimFloat } from '@/lib/numbers';
import type { Units } from '@/lib/storage';

import {
  defaultHands,
  kgToUnit,
  loadModesFor,
  machineLoads,
  snapPlate,
  unitToKg,
  type LoadDetail,
  type LoadMode,
} from '../load';
import {
  addPlate,
  barFor,
  barInUnit,
  barsFor,
  barLabel,
  DUMBBELL_PRESETS,
  equivalentIn,
  platesForSide,
  platesToSide,
  removePlate,
  sideTextFromTotal,
  totalFromSide,
} from '../plate-math';
import { BarbellLoadForm } from './load/BarbellLoadForm';
import { DumbbellLoadForm } from './load/DumbbellLoadForm';
import { LoadSectionLabel } from './load/LoadSectionLabel';
import { MachineLoadForm } from './load/MachineLoadForm';

export type LoadApply = {
  /** The row's weight text in the display unit: a total, or ONE dumbbell. */
  weightText: string;
  /** How it was built (kg), null for a plain number. */
  load: LoadDetail | null;
  /** The lifter changed something — the config is worth saving on the exercise. */
  changed: boolean;
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
  unilateral: boolean;
  /** The mode to open in when the equipment offers several (the machine chooser). */
  preferMode?: LoadMode;
  onApply: (result: LoadApply) => void;
};

const trim = (n: number): number => trimFloat(n, 3);
const num = parseDecimal;

/**
 * The weight sheet, shaped by how the exercise is loaded: a bar takes plates
 * per side (and remembers which bar; a plate-loaded machine types its base
 * instead), a stack takes a base + increment and offers the pins as badges,
 * dumbbells take ONE dumbbell and count hands. The sheet works in the DISPLAY
 * unit end to end (see plate-math) and converts once at Apply; an untouched
 * open → Apply returns the row's text as-is.
 */
export const WeightCalculatorSheet = ({
  visible,
  onClose,
  unit,
  initialWeight,
  initialLoad,
  equipment,
  unilateral,
  preferMode,
  onApply,
}: Props) => {
  const t = useT();
  const [mode, setMode] = useState<LoadMode>('none');
  // Barbell (and plate-loaded machine)
  const [barId, setBarId] = useState(barsFor(unit)[0].id);
  const [plates, setPlates] = useState<number[]>([]);
  const [sledText, setSledText] = useState('');
  /** A plate machine: two horns (plates ×2) or one post (plates once). */
  const [sides, setSides] = useState<1 | 2>(2);
  // Machine stack
  const [baseText, setBaseText] = useState('');
  const [incText, setIncText] = useState('');
  const [step, setStep] = useState<number | null>(null);
  // Dumbbell
  const [perHandText, setPerHandText] = useState('');
  const [hands, setHands] = useState<1 | 2>(2);
  // None
  const [plainText, setPlainText] = useState('');
  // Until the lifter edits something, Apply hands back the row's text verbatim:
  // a total the sheet cannot split (below the bar, not a number) must not come
  // back as the bar weight.
  const [touched, setTouched] = useState(false);
  /** A machine marked as plates carries its sled weight where a bar would go. */
  const plateMachine = equipment === 'machine';
  // The sheet stays mounted between opens, so reseed on every open rather than
  // once at mount — otherwise it reopened on the first row's numbers.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setTouched(false);
      // Known equipment locks the mode; a saved detail of another kind (a
      // custom exercise whose equipment changed) yields to it.
      const offered = loadModesFor(equipment, initialLoad);
      const saved = initialLoad?.kind;
      setMode(
        saved && offered.includes(saved)
          ? saved
          : preferMode && offered.includes(preferMode)
            ? preferMode
            : offered[0],
      );
      const row = num(initialWeight);
      // Plates: the saved plates when the row still carries them, else the
      // row's total split over the saved (or default) bar onto the rack.
      const bar =
        (initialLoad?.kind === 'barbell' ? barFor(initialLoad.barKg, unit) : null) ??
        barsFor(unit)[0];
      setBarId(bar.id);
      const sled = initialLoad?.kind === 'barbell' ? kgToUnit(initialLoad.barKg, unit) : 0;
      setSledText(sled > 0 ? String(sled) : '');
      const sidesNow = initialLoad?.kind === 'barbell' ? (initialLoad.sides ?? 2) : 2;
      setSides(sidesNow);
      const baseWeight = plateMachine ? sled : barInUnit(bar, unit);
      const savedPlates =
        initialLoad?.kind === 'barbell' ? initialLoad.platesKg.map((p) => snapPlate(p, unit)) : [];
      const savedTotal = totalFromSide(platesToSide(savedPlates), baseWeight, sidesNow);
      const platesMatch =
        savedPlates.length > 0 && row != null && Math.abs(savedTotal - row) < 0.02;
      setPlates(
        platesMatch
          ? savedPlates
          : (platesForSide(
              num(sideTextFromTotal(initialWeight, baseWeight, sidesNow)) ?? 0,
              unit,
            ) ?? []),
      );
      // Stack: the saved base/increment, the row's number on the nearest pin.
      const base = initialLoad?.kind === 'machine' ? kgToUnit(initialLoad.baseKg, unit) : null;
      const inc = initialLoad?.kind === 'machine' ? kgToUnit(initialLoad.incrementKg, unit) : null;
      setBaseText(base != null ? String(base) : '');
      setIncText(inc != null && inc > 0 ? String(inc) : '');
      const pin = base != null && inc != null && inc > 0 && row != null ? (row - base) / inc : null;
      const onPin = pin != null && pin >= 0 && Math.abs(pin - Math.round(pin)) < 0.001;
      setStep(onPin ? Math.round(pin) : null);
      // Dumbbell: the row's number IS one dumbbell.
      setPerHandText(initialWeight);
      setHands(initialLoad?.kind === 'dumbbell' ? initialLoad.hands : defaultHands(unilateral));
      setPlainText(initialWeight);
    }
  }

  /** Every edit goes through here so Apply knows the config changed. */
  const edit =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      setTouched(true);
      set(v);
    };

  /* ── Plates ──────────────────────────────────────────────────────────── */
  const bar = barsFor(unit).find((b) => b.id === barId) ?? barsFor(unit)[0];
  const sledWeight = num(sledText) ?? 0;
  const baseWeight = plateMachine ? sledWeight : barInUnit(bar, unit);
  const side = platesToSide(plates);
  const barbellTotal = totalFromSide(side, baseWeight, plateMachine ? sides : 2);
  const barItems = useMemo(
    () =>
      barsFor(unit).map((b) => ({
        value: b.id,
        label: b.kg === 0 ? t('training.barNone') : `${barLabel(b, unit)} ${unit}`,
      })),
    [t, unit],
  );
  const onAddPlate = edit((p: number) => setPlates((prev) => addPlate(prev, p)));
  const onRemovePlate = edit((p: number) => setPlates((prev) => removePlate(prev, p)));

  /* ── Stack ───────────────────────────────────────────────────────────── */
  const base = num(baseText) ?? 0;
  const inc = num(incText) ?? 0;
  const pins = useMemo(() => machineLoads(base, inc), [base, inc]);
  const machineTotal = step != null ? (pins[step] ?? 0) : 0;

  /* ── Dumbbell ────────────────────────────────────────────────────────── */
  const perHand = num(perHandText);
  const dumbbellTotal = perHand != null ? trim(perHand * hands) : 0;

  const total =
    mode === 'barbell'
      ? barbellTotal
      : mode === 'machine'
        ? machineTotal
        : mode === 'dumbbell'
          ? dumbbellTotal
          : (num(plainText) ?? 0);

  // Every mode but the plain number must leave with a complete picture: that
  // picture is what the sheet saves, a half-described stack saves nothing.
  const canApply =
    mode === 'dumbbell' ? perHand != null : mode === 'machine' ? inc > 0 && step != null : true;

  const build = (): LoadApply => {
    if (!touched) return { weightText: initialWeight, load: initialLoad, changed: false };
    if (mode === 'barbell') {
      const load: LoadDetail = {
        kind: 'barbell',
        barKg: plateMachine ? unitToKg(sledWeight, unit) : bar.kg,
        platesKg: plates.map((p) => unitToKg(p, unit)),
        ...(plateMachine && sides === 1 ? { sides: 1 as const } : {}),
      };
      return { weightText: String(barbellTotal), load, changed: true };
    }
    if (mode === 'machine') {
      const load: LoadDetail | null =
        step != null && inc > 0
          ? {
              kind: 'machine',
              baseKg: unitToKg(base, unit),
              incrementKg: unitToKg(inc, unit),
              steps: step,
            }
          : null;
      return { weightText: String(machineTotal), load, changed: true };
    }
    if (mode === 'dumbbell') {
      const kg = unitToKg(perHand ?? 0, unit);
      return {
        weightText: String(perHand ?? ''),
        load: { kind: 'dumbbell', perHandKg: kg, hands },
        changed: true,
      };
    }
    return { weightText: plainText, load: null, changed: true };
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
    <Sheet visible={visible} onClose={onClose}>
      {/* Scrolls only when a small screen (or the keyboard) cannot fit the form;
          the sheet itself grows to show every field and both buttons. */}
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-lg font-sans-bold text-ink-50">
          {t('training.calculatorTitle')}
        </Text>
        <Text className="mb-4 text-sm leading-5 text-ink-400">{t('load.sheetHint')}</Text>

        {modes.length > 1 ? (
          <>
            <LoadSectionLabel
              label={plateMachine ? t('load.machineKindTitle') : t('load.kind')}
              first
            />
            <ChipRow items={modeItems} value={mode} onChange={edit(setMode)} />
          </>
        ) : null}

        {mode === 'barbell' ? (
          <BarbellLoadForm
            unit={unit}
            barItems={barItems}
            barId={barId}
            onBar={edit(setBarId)}
            base={plateMachine ? { text: sledText, onText: edit(setSledText) } : undefined}
            sides={plateMachine ? { value: sides, onChange: edit(setSides) } : undefined}
            hasBar={bar.kg > 0}
            plates={plates}
            onAddPlate={onAddPlate}
            onRemovePlate={onRemovePlate}
          />
        ) : null}

        {mode === 'machine' ? (
          <MachineLoadForm
            unit={unit}
            baseText={baseText}
            onBaseText={edit(setBaseText)}
            incText={incText}
            onIncText={edit((text: string) => {
              setIncText(text);
              setStep(null);
            })}
            pins={pins}
            step={step}
            onPick={edit(setStep)}
          />
        ) : null}

        {mode === 'dumbbell' ? (
          <DumbbellLoadForm
            unit={unit}
            perHandText={perHandText}
            onPerHandText={edit(setPerHandText)}
            presets={DUMBBELL_PRESETS[unit]}
            missing={perHand == null}
            hands={hands}
            onHands={edit(setHands)}
          />
        ) : null}

        {mode === 'none' ? (
          <View className="mt-4">
            <Input
              label={t('training.weight')}
              rightSlot={<UnitSuffix label={unit} />}
              value={plainText}
              onChangeText={edit(setPlainText)}
              keyboardType="decimal-pad"
              placeholder="0"
              maxLength={6}
            />
          </View>
        ) : null}

        <View className="mt-5 rounded-field bg-ink-800 px-4 py-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-sm text-ink-400">
              {mode === 'dumbbell' ? t('load.totalBothHands') : t('training.total')}
            </Text>
            <Text className="text-2xl font-sans-bold tabular-nums text-ink-50">
              {total} {unit}
            </Text>
          </View>
          <Text className="mt-0.5 text-right text-xs text-ink-500">
            {t('training.totalEquivalent', {
              value: equivalentIn(total, unit),
              unit: unit === 'kg' ? 'lb' : 'kg',
            })}
          </Text>
          {mode !== 'none' ? (
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
              label={t('training.applyWeight')}
              disabled={!canApply}
              onPress={() => {
                onApply(build());
                onClose();
              }}
            />
          </View>
        </View>
      </ScrollArea>
    </Sheet>
  );
};
