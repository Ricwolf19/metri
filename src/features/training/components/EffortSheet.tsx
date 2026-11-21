import { Pressable, Text, View } from 'react-native';

import { FlameIcon } from '@/components/icons';
import { ScrollArea, Sheet } from '@/components/ui';
import type { EffortMode } from '@/db/schema';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { BAND_EFFORT, EFFORT_BANDS, RIR_OPEN_END, rirText } from '../effort-mode';
import { EFFORT_BAND_COPY } from '../labels';
import type { Effort } from '../workout-drafts';

type Props = {
  visible: boolean;
  /** The session's effort logging (`effortModeFor`): which scale the sheet offers. */
  mode: EffortMode;
  /** A pick; `{ rir: null, failure: false }` is "no effort" (free mode only). */
  onPick: (effort: Effort) => void;
  onClose: () => void;
};

const ROW = 'flex-row items-center gap-3 rounded-field border px-4';
const FAILURE_ROW = `${ROW} border-red-400/40 bg-red-500/10`;
const PLAIN_ROW = `${ROW} border-ink-700 bg-ink-800`;

/** Every reserve the professional scale names below its open end: 1–4. */
const RESERVES = Array.from({ length: RIR_OPEN_END - 1 }, (_, i) => i + 1);

/** The professional scale: failure, 1–4 in reserve, then the open end "5+". */
const RirOptions = ({ onPick }: { onPick: (effort: Effort) => void }) => {
  const t = useT();
  const { danger } = useTheme();
  return (
    <>
      <Pressable
        onPress={() => onPick(BAND_EFFORT.failure)}
        accessibilityRole="button"
        className={`${FAILURE_ROW} py-3.5`}
      >
        <FlameIcon color={danger} size={18} />
        <Text className="flex-1 text-sm font-sans-semibold text-red-400">
          {t('training.effortFailure')}
        </Text>
      </Pressable>
      {RESERVES.map((n) => (
        <Pressable
          key={n}
          onPress={() => onPick({ rir: n, failure: false })}
          accessibilityRole="button"
          className={`${PLAIN_ROW} py-3.5`}
        >
          <View className="h-7 w-7 items-center justify-center rounded-full bg-brand/15">
            <Text className="text-sm font-sans-bold text-brand">{n}</Text>
          </View>
          <Text className="flex-1 text-sm font-sans-medium text-ink-100">
            {t('training.effortRir')}
          </Text>
        </Pressable>
      ))}
      {/* The open end of the scale: anything easier than four. */}
      <Pressable
        onPress={() => onPick({ rir: RIR_OPEN_END, failure: false })}
        accessibilityRole="button"
        className={`${PLAIN_ROW} py-3.5`}
      >
        <View className="h-7 w-7 items-center justify-center rounded-full bg-ink-700">
          <Text className="text-sm font-sans-bold text-ink-200">{rirText(RIR_OPEN_END)}</Text>
        </View>
        <Text className="flex-1 text-sm font-sans-medium text-ink-100">
          {t('training.effortRir5')}
        </Text>
      </Pressable>
    </>
  );
};

/**
 * The simple scale: four bands in plain words, each with what it means in reps
 * left, stored on the professional columns (`BAND_EFFORT`).
 */
const BandOptions = ({ onPick }: { onPick: (effort: Effort) => void }) => {
  const t = useT();
  const { danger } = useTheme();
  return (
    <>
      {EFFORT_BANDS.map((band) => {
        const failure = band === 'failure';
        const copy = EFFORT_BAND_COPY[band];
        return (
          <Pressable
            key={band}
            onPress={() => onPick(BAND_EFFORT[band])}
            accessibilityRole="button"
            className={`${failure ? FAILURE_ROW : PLAIN_ROW} py-3`}
          >
            {failure ? <FlameIcon color={danger} size={18} /> : null}
            <View className="min-w-0 flex-1">
              <Text
                className={[
                  'text-sm font-sans-semibold',
                  failure ? 'text-red-400' : 'text-ink-100',
                ].join(' ')}
              >
                {t(copy.label)}
              </Text>
              <Text className="mt-0.5 text-xs text-ink-400">{t(copy.line)}</Text>
            </View>
          </Pressable>
        );
      })}
    </>
  );
};

/**
 * The one place a set's effort gets reported, in the session's mode: the
 * professional scale (`rir`, and `free`, which adds a way to clear it — effort
 * is optional there) or the plain bands (`simple`).
 */
export const EffortSheet = ({ visible, mode, onPick, onClose }: Props) => {
  const t = useT();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollArea inSheet>
        <View className="pb-6">
          <Text className="mb-3 text-lg font-sans-bold text-ink-50">
            {t('training.effortTitle')}
          </Text>
          <View className="gap-2">
            {mode === 'simple' ? <BandOptions onPick={onPick} /> : <RirOptions onPick={onPick} />}
            {mode === 'free' ? (
              <Pressable
                onPress={() => onPick({ rir: null, failure: false })}
                accessibilityRole="button"
                // Literal dp: NativeWind's rem is 14, so `min-h-11` is 38.5.
                style={{ minHeight: 44 }}
                className="items-center justify-center rounded-field px-4 py-3 active:bg-ink-800"
              >
                <Text className="text-sm font-sans-medium text-ink-300">
                  {t('training.effortClear')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </ScrollArea>
    </Sheet>
  );
};
