import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { XIcon } from '@/components/icons';
import { Button, ChipRow, Input, ScrollArea, ScrollRow, Sheet } from '@/components/ui';
import { CONTROL_FONT_SCALE } from '@/components/ui/typography';
import { UnitSuffix } from '@/features/training/components/UnitSuffix';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import {
  addPlate,
  BARS,
  barInUnit,
  barLabel,
  equivalentIn,
  platesToSide,
  plateOptions,
  removePlate,
  sideTextFromTotal,
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
 * total back to the set row's weight input. Everything is in the display unit
 * (see plate-math), so an untouched open → Apply returns the row's text as-is.
 */
export const WeightCalculatorSheet = ({ visible, onClose, unit, initialTotal, onApply }: Props) => {
  const t = useT();
  const { muted } = useTheme();
  const [barId, setBarId] = useState(BARS[0].id);
  const [plates, setPlates] = useState<number[]>([]);
  const [sideText, setSideText] = useState('');
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
      setBarId(BARS[0].id);
      setPlates([]);
      setTouched(false);
      setSideText(sideTextFromTotal(initialTotal, barInUnit(BARS[0], unit)));
    }
  }

  const bar = BARS.find((b) => b.id === barId) ?? BARS[0];
  const plateSum = platesToSide(plates);
  const typed = Number(sideText);
  // Typed text wins over tapped plates — the field is where deliberate entry lands.
  const side = sideText.trim() !== '' && Number.isFinite(typed) ? typed : plateSum;
  const total = totalFromSide(Math.max(0, side), barInUnit(bar, unit));

  const barItems = useMemo(
    () =>
      BARS.map((b) => ({
        value: b.id,
        label: b.kg === 0 ? t('training.barNone') : `${barLabel(b, unit)} ${unit}`,
      })),
    [t, unit],
  );

  // Tapping plates edits the tapped list; the manual field gives it up.
  const onAdd = (p: number) => {
    setTouched(true);
    setSideText('');
    setPlates((prev) => addPlate(prev, p));
  };
  const onRemove = (p: number) => {
    setTouched(true);
    setSideText('');
    setPlates((prev) => removePlate(prev, p));
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      {/* Scrolls only when a small screen (or the keyboard) cannot fit the form;
          the sheet itself grows to show every field and both buttons. */}
      <ScrollArea inSheet keyboardShouldPersistTaps="handled">
        <Text className="mb-1 text-lg font-sans-bold text-ink-50">
          {t('training.calculatorTitle')}
        </Text>
        <Text className="mb-4 text-sm leading-5 text-ink-400">{t('training.calculatorHint')}</Text>

        <Text className="mb-1.5 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {t('training.bar')}
        </Text>
        <ChipRow
          items={barItems}
          value={barId}
          onChange={(next) => {
            setTouched(true);
            setBarId(next);
          }}
        />

        <View className="mt-4">
          <Input
            label={t('training.perSide')}
            rightSlot={<UnitSuffix label={unit} />}
            value={sideText}
            onChangeText={(text) => {
              setTouched(true);
              setSideText(text);
            }}
            keyboardType="decimal-pad"
            placeholder={String(plateSum)}
            maxLength={6}
          />
        </View>

        <Text className="mb-1.5 mt-4 font-mono-medium text-xs uppercase tracking-wider text-ink-300">
          {t('training.plates')}
        </Text>
        {/* A side can hold several plates of one size (2 × 20), so an option
            always ADDS one; the loaded strip below is where one comes off. */}
        <ScrollRow>
          {plateOptions(unit).map((p) => (
            <Pressable
              key={p}
              onPress={() => onAdd(p)}
              accessibilityRole="button"
              accessibilityLabel={`${p} ${unit}`}
              className="shrink-0 rounded-full border border-ink-700 bg-ink-800 px-3.5 py-2"
            >
              <Text
                maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                className="text-sm font-sans-semibold text-ink-300"
              >
                +{p} {unit}
              </Text>
            </Pressable>
          ))}
        </ScrollRow>
        {plates.length > 0 ? (
          <View className="mt-3">
            <ScrollRow>
              {plates.map((p, i) => (
                <Pressable
                  // Duplicates are the point, so position disambiguates the key.
                  key={`${p}-${i}`}
                  onPress={() => onRemove(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p} ${unit}`}
                  accessibilityHint={t('training.tapToRemovePlate')}
                  className="shrink-0 flex-row items-center gap-1 rounded-full border border-brand/40 bg-brand/15 py-2 pl-3.5 pr-2.5"
                >
                  <Text
                    maxFontSizeMultiplier={CONTROL_FONT_SCALE}
                    className="text-sm font-sans-semibold text-brand"
                  >
                    {p} {unit}
                  </Text>
                  <XIcon color={muted} size={14} />
                </Pressable>
              ))}
            </ScrollRow>
          </View>
        ) : null}

        <View className="mt-5 rounded-field bg-ink-800 px-4 py-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="text-sm text-ink-400">{t('training.total')}</Text>
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
                onApply(touched ? String(total) : initialTotal);
                onClose();
              }}
            />
          </View>
        </View>
      </ScrollArea>
    </Sheet>
  );
};
