import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { Button, ChipRow, Input, ScrollArea, Sheet } from '@/components/ui';
import type { Equipment } from '@/db/schema';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import {
  LOAD_KIND_FOR,
  defaultHands,
  kgToUnit,
  machineLoads,
  snapPlate,
  unitToKg,
  type LoadDetail,
  type LoadKind,
} from '../load';
import {
  addPlate,
  BARS,
  barInUnit,
  barLabel,
  equivalentIn,
  platesToSide,
  removePlate,
  sideTextFromTotal,
  totalFromSide,
} from '../plate-math';
import { BarbellLoadForm } from './load/BarbellLoadForm';
import { DumbbellLoadForm } from './load/DumbbellLoadForm';
import { LoadSectionLabel } from './load/LoadSectionLabel';
import { MachineLoadForm } from './load/MachineLoadForm';

type Mode = LoadKind | 'none';

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
  onApply: (result: LoadApply) => void;
};

/** Float-noise guard for the display-unit arithmetic. */
const trim = (n: number): number => Number(n.toFixed(3));

const num = (text: string): number | null => {
  const n = Number(text);
  return text.trim() !== '' && Number.isFinite(n) ? n : null;
};

/**
 * The weight sheet, shaped by how the exercise is loaded: a bar takes plates
 * per side (and remembers which bar), a stack takes a base + increment and
 * offers the pins as badges, dumbbells take ONE dumbbell and count hands. The
 * sheet works in the DISPLAY unit end to end (see plate-math) and converts
 * once at Apply; an untouched open → Apply returns the row's text as-is.
 */
export const WeightCalculatorSheet = ({
  visible,
  onClose,
  unit,
  initialWeight,
  initialLoad,
  equipment,
  unilateral,
  onApply,
}: Props) => {
  const t = useT();
  const [mode, setMode] = useState<Mode>('none');
  // Barbell
  const [barId, setBarId] = useState(BARS[0].id);
  const [plates, setPlates] = useState<number[]>([]);
  const [sideText, setSideText] = useState('');
  // Machine
  const [baseText, setBaseText] = useState('');
  const [incText, setIncText] = useState('');
  const [step, setStep] = useState<number | null>(null);
  const [otherText, setOtherText] = useState('');
  // Dumbbell
  const [perHandText, setPerHandText] = useState('');
  const [hands, setHands] = useState<1 | 2>(2);
  // None
  const [plainText, setPlainText] = useState('');
  // Until the lifter edits something, Apply hands back the row's text verbatim:
  // a total the sheet cannot split (below the bar, not a number) must not come
  // back as the bar weight.
  const [touched, setTouched] = useState(false);
  // The sheet stays mounted between opens, so reseed on every open rather than
  // once at mount — otherwise it reopened on the first row's numbers.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setTouched(false);
      const kind: Mode =
        initialLoad?.kind ?? (equipment ? LOAD_KIND_FOR[equipment] : null) ?? 'none';
      setMode(kind);
      const row = num(initialWeight);
      // Barbell: the saved plates when the row still carries them, else split
      // the row's total over the saved (or default) bar.
      const bar =
        initialLoad?.kind === 'barbell'
          ? (BARS.find((b) => b.kg === initialLoad.barKg) ?? BARS[0])
          : BARS[0];
      setBarId(bar.id);
      const savedPlates =
        initialLoad?.kind === 'barbell' ? initialLoad.platesKg.map((p) => snapPlate(p, unit)) : [];
      const savedTotal = totalFromSide(platesToSide(savedPlates), barInUnit(bar, unit));
      const platesMatch =
        savedPlates.length > 0 && row != null && Math.abs(savedTotal - row) < 0.02;
      setPlates(platesMatch ? savedPlates : []);
      setSideText(platesMatch ? '' : sideTextFromTotal(initialWeight, barInUnit(bar, unit)));
      // Machine: the saved base/increment, the row's number on the nearest pin.
      const base = initialLoad?.kind === 'machine' ? kgToUnit(initialLoad.baseKg, unit) : null;
      const inc = initialLoad?.kind === 'machine' ? kgToUnit(initialLoad.incrementKg, unit) : null;
      setBaseText(base != null ? String(base) : '');
      setIncText(inc != null ? String(inc) : '');
      const pin = base != null && inc != null && inc > 0 && row != null ? (row - base) / inc : null;
      const onPin = pin != null && pin >= 0 && Math.abs(pin - Math.round(pin)) < 0.001;
      setStep(onPin ? Math.round(pin) : null);
      setOtherText(onPin || row == null ? '' : initialWeight);
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

  /* ── Barbell ─────────────────────────────────────────────────────────── */
  const bar = BARS.find((b) => b.id === barId) ?? BARS[0];
  const barWeight = barInUnit(bar, unit);
  const plateSum = platesToSide(plates);
  const typedSide = num(sideText);
  // Typed text wins over tapped plates — the field is where deliberate entry lands.
  const side = typedSide ?? plateSum;
  const barbellTotal = totalFromSide(Math.max(0, side), barWeight);
  const barItems = useMemo(
    () =>
      BARS.map((b) => ({
        value: b.id,
        label: b.kg === 0 ? t('training.barNone') : `${barLabel(b, unit)} ${unit}`,
      })),
    [t, unit],
  );
  // Tapping plates edits the tapped list; the manual field gives it up.
  const onAddPlate = edit((p: number) => {
    setSideText('');
    setPlates((prev) => addPlate(prev, p));
  });
  const onRemovePlate = edit((p: number) => {
    setSideText('');
    setPlates((prev) => removePlate(prev, p));
  });

  /* ── Machine ─────────────────────────────────────────────────────────── */
  const base = num(baseText) ?? 0;
  const inc = num(incText) ?? 0;
  const pins = useMemo(() => machineLoads(base, inc), [base, inc]);
  const other = num(otherText);
  const machineTotal = other ?? (step != null ? (pins[step] ?? 0) : 0);

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

  const canApply = mode !== 'dumbbell' || perHand != null;

  const build = (): LoadApply => {
    if (!touched) return { weightText: initialWeight, load: initialLoad, changed: false };
    if (mode === 'barbell') {
      // A typed per-side number names no plates, so the picture cannot be saved.
      const load: LoadDetail | null =
        typedSide == null
          ? { kind: 'barbell', barKg: bar.kg, platesKg: plates.map((p) => unitToKg(p, unit)) }
          : null;
      return { weightText: String(barbellTotal), load, changed: true };
    }
    if (mode === 'machine') {
      const load: LoadDetail | null =
        other == null && step != null && inc > 0
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

  const modeItems: { value: Mode; label: string }[] = [
    { value: 'barbell', label: t('load.kindBarbell') },
    { value: 'machine', label: t('load.kindMachine') },
    { value: 'dumbbell', label: t('load.kindDumbbell') },
    { value: 'none', label: t('load.kindNone') },
  ];

  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* Scrolls only when a small screen (or the keyboard) cannot fit the form;
          the sheet itself grows to show every field and both buttons. */}
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-lg font-sans-bold text-ink-50">
          {t('training.calculatorTitle')}
        </Text>
        <Text className="mb-4 text-sm leading-5 text-ink-400">{t('load.sheetHint')}</Text>

        <LoadSectionLabel label={t('load.kind')} first />
        <ChipRow items={modeItems} value={mode} onChange={edit(setMode)} />

        {mode === 'barbell' ? (
          <BarbellLoadForm
            unit={unit}
            barItems={barItems}
            barId={barId}
            onBar={edit(setBarId)}
            hasBar={bar.kg > 0}
            plates={plates}
            plateSum={plateSum}
            onAddPlate={onAddPlate}
            onRemovePlate={onRemovePlate}
            sideText={sideText}
            onSideText={edit(setSideText)}
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
            step={other == null ? step : null}
            onPick={edit((i: number) => {
              setOtherText('');
              setStep(i);
            })}
            otherText={otherText}
            onOtherText={edit(setOtherText)}
          />
        ) : null}

        {mode === 'dumbbell' ? (
          <DumbbellLoadForm
            unit={unit}
            perHandText={perHandText}
            onPerHandText={edit(setPerHandText)}
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
