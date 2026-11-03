import { Text, View } from 'react-native';

import { BarGraphic } from '@/components/BarGraphic';
import { DumbbellIcon } from '@/components/icons';
import { Button, ScrollArea, Sheet } from '@/components/ui';
import type { Equipment } from '@/db/schema';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import {
  defaultBarKg,
  kgToUnit,
  loadFromSide,
  snapPlate,
  stackPlates,
  type LoadDetail,
} from '../load';
import { equivalentIn } from '../plate-math';
import { weightText } from '../set-prefill';

/** The set on view: what was logged, and how it was built when that was saved. */
export type PreviewSet = { weightKg: number; reps: number; load?: LoadDetail | null };

type Props = {
  set: PreviewSet | null;
  onClose: () => void;
  unit: Units;
  equipment: Equipment | null;
};

/**
 * A bar set logged before plates were saved still has a picture: its total
 * split onto the default bar. Anything else without a detail is just a number.
 */
const pictureOf = (
  set: PreviewSet,
  equipment: Equipment | null,
  unit: Units,
): LoadDetail | null => {
  if (set.load) return set.load;
  if (equipment !== 'barbell') return null;
  const bar = defaultBarKg(unit);
  const side = (kgToUnit(set.weightKg, unit) - kgToUnit(bar, unit)) / 2;
  return side >= 0 ? loadFromSide(Math.round(side * 100) / 100, bar, unit) : null;
};

const Line = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row items-baseline justify-between gap-3 py-1.5">
    <Text className="text-sm text-ink-400">{label}</Text>
    <Text className="flex-1 text-right text-sm font-sans-semibold tabular-nums text-ink-100">
      {value}
    </Text>
  </View>
);

/**
 * A logged weight, read as what was on the bar: the plates on each sleeve, the
 * pin in the stack, the dumbbells in each hand — read-only, the same picture
 * the load sheet builds. The other unit stays as one line under the total.
 */
export const LoadPreviewSheet = ({ set, onClose, unit, equipment }: Props) => {
  const t = useT();
  const { info } = useTheme();
  const other: Units = unit === 'kg' ? 'lb' : 'kg';
  const load = set ? pictureOf(set, equipment, unit) : null;
  const total = set ? weightText(set.weightKg, unit) : '';
  // One side's plates on this unit's rack: the drawing and the line under it.
  const sidePlates =
    load?.kind === 'barbell' ? stackPlates(load.platesKg.map((p) => snapPlate(p, unit))) : [];
  return (
    <Sheet visible={set !== null} onClose={onClose}>
      <ScrollArea inSheet>
        <Text className="font-mono-medium text-xs uppercase tracking-wider text-ink-400">
          {t('loadView.title')}
        </Text>
        <View className="mt-2 flex-row items-baseline justify-between">
          <Text className="text-2xl font-sans-bold tabular-nums text-ink-50">
            {total} {unit}
            {set ? <Text className="text-base text-ink-400"> × {set.reps}</Text> : null}
          </Text>
          <Text className="text-xs text-ink-500">
            {t('training.totalEquivalent', {
              value: equivalentIn(Number(total), unit),
              unit: other,
            })}
          </Text>
        </View>

        {load?.kind === 'barbell' ? (
          <View className="mt-4">
            <BarGraphic plates={sidePlates} bar={load.barKg > 0} mirror={(load.sides ?? 2) === 2} />
            <View className="mt-3">
              {load.barKg > 0 ? (
                <Line
                  label={t(equipment === 'machine' ? 'loadView.base' : 'loadView.bar')}
                  value={`${kgToUnit(load.barKg, unit)} ${unit}`}
                />
              ) : null}
              <Line
                label={t((load.sides ?? 2) === 2 ? 'loadView.perSide' : 'loadView.onePost')}
                value={
                  sidePlates.length
                    ? sidePlates
                        .map(({ plate, count }) => (count > 1 ? `${plate} × ${count}` : `${plate}`))
                        .join(' + ')
                    : '—'
                }
              />
            </View>
            {!set?.load ? (
              <Text className="mt-2 text-xs leading-4 text-ink-500">{t('loadView.derived')}</Text>
            ) : null}
          </View>
        ) : null}

        {load?.kind === 'machine' ? (
          <View className="mt-4">
            <Line label={t('loadView.base')} value={`${kgToUnit(load.baseKg, unit)} ${unit}`} />
            <Line
              label={t('loadView.pin')}
              value={`${load.steps} × ${kgToUnit(load.incrementKg, unit)} ${unit}`}
            />
          </View>
        ) : null}

        {load?.kind === 'dumbbell' ? (
          <View className="mt-4 items-center">
            <View className="flex-row gap-6">
              {Array.from({ length: load.hands }, (_, i) => (
                <View key={i} className="items-center">
                  <DumbbellIcon color={info} size={32} />
                  <Text className="mt-1 text-sm font-sans-semibold tabular-nums text-ink-100">
                    {kgToUnit(load.perHandKg, unit)} {unit}
                  </Text>
                </View>
              ))}
            </View>
            <Text className="mt-2 text-xs text-ink-500">
              {t(load.hands === 2 ? 'loadView.twoDumbbells' : 'loadView.oneDumbbell')}
            </Text>
          </View>
        ) : null}

        {!load ? (
          <Text className="mt-4 text-sm leading-5 text-ink-400">{t('loadView.noDetail')}</Text>
        ) : null}

        <View className="mt-5">
          <Button variant="secondary" label={t('common.close')} onPress={onClose} />
        </View>
      </ScrollArea>
    </Sheet>
  );
};
