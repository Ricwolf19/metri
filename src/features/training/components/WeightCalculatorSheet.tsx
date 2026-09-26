import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button, ChipRow, Input, Sheet } from '@/components/ui';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';

import {
  BARS,
  barLabel,
  equivalentIn,
  fromDisplay,
  platesToSide,
  plateOptions,
  sideTextFromTotal,
  toDisplay,
  totalFromSide,
} from '../plate-math';

type Props = {
  visible: boolean;
  onClose: () => void;
  unit: Units;
  /** The row's current weight draft — a TOTAL, split per side on open. */
  initialTotal: string;
  onApply: (weightText: string) => void;
};

/**
 * Quick total-weight calculator for plate-loaded bars and machines (backlog
 * B1/B3): pick a bar (or none), tap the plates loaded on ONE side — the other
 * side is assumed identical — or type the per-side load directly, and the
 * total updates instantly with the other unit's equivalent. Apply hands the
 * total back to the set row's weight input.
 */
export const WeightCalculatorSheet = ({ visible, onClose, unit, initialTotal, onApply }: Props) => {
  const t = useT();
  const [barId, setBarId] = useState(BARS[0].id);
  const [plates, setPlates] = useState<number[]>([]);
  const [sideText, setSideText] = useState('');
  // The sheet stays mounted between opens, so reseed on every open rather than
  // once at mount — otherwise it reopened on the first row's numbers.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setBarId(BARS[0].id);
      setPlates([]);
      setSideText(sideTextFromTotal(initialTotal, BARS[0].kg, unit));
    }
  }

  const bar = BARS.find((b) => b.id === barId) ?? BARS[0];
  const plateSum = platesToSide(plates.map((p) => fromDisplay(p, unit)));
  const typed = Number(sideText);
  // Typed text wins over tapped plates — the field is where deliberate entry lands.
  const sideDisplay =
    sideText.trim() !== '' && Number.isFinite(typed) ? typed : toDisplay(plateSum, unit);
  const sideKg = fromDisplay(Math.max(0, sideDisplay), unit);
  const totalKg = totalFromSide(sideKg, bar.kg);
  const totalDisplay = toDisplay(totalKg, unit);

  const barItems = useMemo(
    () =>
      BARS.map((b) => ({
        value: b.id,
        label: b.kg === 0 ? t('training.barNone') : `${barLabel(b, unit)} ${unit}`,
      })),
    [t, unit],
  );

  const togglePlate = (p: number) => {
    // Tapping a plate edits the tapped list; the manual field gives it up.
    setSideText('');
    setPlates((prev) => {
      const i = prev.indexOf(p);
      if (i >= 0) return prev.filter((_, idx) => idx !== i);
      return [...prev, p].sort((a, b) => b - a);
    });
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="px-5 pb-8">
        <Text className="mb-1 text-lg font-sans-bold text-ink-50">
          {t('training.calculatorTitle')}
        </Text>
        <Text className="mb-4 text-sm leading-5 text-ink-400">{t('training.calculatorHint')}</Text>

        <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {t('training.bar')}
        </Text>
        <ChipRow items={barItems} value={barId} onChange={setBarId} />

        <View className="mt-4">
          <Input
            label={`${t('training.perSide')} (${unit})`}
            value={sideText}
            onChangeText={setSideText}
            keyboardType="decimal-pad"
            placeholder={String(toDisplay(plateSum, unit))}
            maxLength={6}
          />
        </View>

        <Text className="mb-1.5 mt-4 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {t('training.plates')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {plateOptions(unit).map((p) => {
            const active = plates.includes(p);
            return (
              <Pressable
                key={p}
                onPress={() => togglePlate(p)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                className={[
                  'rounded-full border px-3.5 py-2',
                  active ? 'border-brand/40 bg-brand/15' : 'border-ink-700 bg-ink-800',
                ].join(' ')}
              >
                <Text
                  className={[
                    'text-sm font-sans-semibold',
                    active ? 'text-brand' : 'text-ink-300',
                  ].join(' ')}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="mt-5 rounded-field bg-ink-800 px-4 py-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-sm text-ink-400">{t('training.total')}</Text>
            <Text className="text-2xl font-sans-bold tabular-nums text-ink-50">
              {totalDisplay} {unit}
            </Text>
          </View>
          <Text className="mt-0.5 text-right text-xs text-ink-500">
            {t('training.totalEquivalent', {
              value: equivalentIn(totalDisplay, unit),
              unit: unit === 'kg' ? 'lb' : 'kg',
            })}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <View className="flex-1">
            <Button variant="secondary" label={t('common.cancel')} onPress={onClose} />
          </View>
          <View className="flex-1">
            <Button
              variant="brand"
              label={t('training.applyWeight')}
              onPress={() => {
                onApply(String(totalDisplay));
                onClose();
              }}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
};
