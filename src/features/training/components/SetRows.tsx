import { Pressable, Text, View, type AccessibilityActionEvent } from 'react-native';

import { CheckIcon, EditIcon, SkipIcon, XIcon } from '@/components/icons';
import { ScrollRow } from '@/components/ui';
import type { EffortMode, SetLog } from '@/db/schema';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';
import { effortWords } from '../labels';
import { loggedSetLabel } from '../session-a11y';
import { weightText } from '../set-prefill';
import { WeightButton } from './WeightButton';

/**
 * Every row is at least 44 dp: the logged and skipped rows carry a 40 dp
 * control at their right edge, and the pending ones match so the list keeps
 * one rhythm. A row's text is ONE line that scrolls sideways when it runs long
 * (a Spanish "AL FALLO" after the RIR, a long prescription): wrapped, the row
 * grew and shoved every row under it; clipped, it hid the reps.
 */
const ROW = 'min-h-11 flex-row items-center rounded-field';

/**
 * The row's text line: fills what the label and the control leave, scrolls
 * past it. A logged row paints the card's inset fill, so its fade says so.
 */
const RowLine = ({ children, sunken }: { children: React.ReactNode; sunken?: boolean }) => (
  <View className="min-w-0 flex-1">
    <ScrollRow className="items-center pr-2" surface={sunken ? 'sunken' : undefined}>
      {children}
    </ScrollRow>
  </View>
);

/** A planned set the lifter skipped: it counts as missed; the X restores it. */
export const SkippedRow = ({
  label,
  text,
  onRestore,
}: {
  label: string;
  text: string;
  onRestore: () => void;
}) => {
  const t = useT();
  const { muted } = useTheme();
  return (
    <View className={`${ROW} border border-red-500/30 bg-red-500/10 py-0.5 pl-3 pr-0.5`}>
      <View className="mr-2.5 h-5 w-5 items-center justify-center rounded-full bg-red-500/30">
        <SkipIcon color={MISSED} size={12} />
      </View>
      <Text className="w-7 text-xs font-sans-semibold text-red-400">{label}</Text>
      <RowLine>
        <Text numberOfLines={1} className="text-xs text-red-400">
          {text}
        </Text>
      </RowLine>
      {/* Restoring is the undo of a skip, so one tap is enough. */}
      <Pressable
        onPress={onRestore}
        accessibilityRole="button"
        accessibilityLabel={t('training.restoreSet', { n: label })}
        className="h-10 w-10 items-center justify-center rounded-full active:bg-red-500/20"
      >
        <XIcon color={muted} size={15} />
      </Pressable>
    </View>
  );
};

/** A set that has not come up yet: the plan, dimmed, no inputs. Sets are done in order. */
export const PendingRow = ({ label, legend }: { label: string; legend: string | null }) => (
  <View className={`${ROW} bg-ink-850/40 px-3 py-2.5`}>
    <Text className="w-7 text-xs font-sans-semibold text-ink-500">{label}</Text>
    <RowLine>
      <Text numberOfLines={1} className="text-xs text-ink-500">
        {legend}
      </Text>
    </RowLine>
  </View>
);

/**
 * A set already logged. The check disc only says so — it does nothing; the
 * weight opens its picture (plates, pin, dumbbells) and the pencil at the
 * right reopens the set in place for a correction, where it can also be
 * deleted (a hold). A delete one hold away on every logged row was a shortcut
 * nobody needed mid-workout. For a screen reader the row is two elements: the
 * set read whole ("Set 2: 60 kg, 8 reps, 2 in reserve"), offering the picture
 * as an action, then the pencil.
 */
export const LoggedRow = ({
  label,
  logged,
  unit,
  effortMode,
  onEdit,
  onWeightPress,
}: {
  label: string;
  logged: SetLog;
  unit: Units;
  /** How this session reads effort (`effortModeFor`): "@ Hard" in simple mode. */
  effortMode: EffortMode;
  onEdit?: () => void;
  onWeightPress?: () => void;
}) => {
  const t = useT();
  const { brandContrast, muted } = useTheme();
  const twoDumbbells = logged.load?.kind === 'dumbbell' && logged.load.hands === 2;
  const effort = effortWords(logged, t, effortMode);
  const actions = onWeightPress ? [{ name: 'showLoad', label: t('loadView.title') }] : undefined;
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'showLoad') onWeightPress?.();
  };
  return (
    <View className={`${ROW} bg-ink-850 py-0.5 pl-3 pr-0.5`}>
      <View
        accessible
        accessibilityLabel={loggedSetLabel(
          {
            n: label,
            weight: weightText(logged.weightKg, unit),
            unit,
            reps: logged.reps,
            twoDumbbells,
            effort: { rir: logged.rir, failure: logged.isFailure },
          },
          t,
          effortMode,
        )}
        accessibilityActions={actions}
        onAccessibilityAction={actions ? onAction : undefined}
        className="min-w-0 flex-1 flex-row items-center"
      >
        <View className="mr-2.5 h-5 w-5 items-center justify-center rounded-full bg-brand">
          <CheckIcon color={brandContrast} size={13} />
        </View>
        <Text className="w-7 text-xs font-sans-semibold text-ink-400">{label}</Text>
        <RowLine sunken>
          {/* Two dumbbells read as "2 × 30 kg × 10": the count goes first so it
              cannot be mistaken for the reps. */}
          {twoDumbbells ? (
            <Text className="text-sm font-sans-medium text-ink-400">2 × </Text>
          ) : null}
          <WeightButton
            kg={logged.weightKg}
            unit={unit}
            onPress={onWeightPress}
            accessible={false}
          />
          {/* The effort in the plan's own notation ("12 reps @ RIR 2"): "× 8 @ RIR 2",
              "× 8 @ Failure" — a failure set stores RIR 0, which never reads. Simple
              mode reads the band: "× 8 @ Hard". */}
          <Text numberOfLines={1} className="text-sm font-sans-medium text-ink-100">
            {' '}
            × {logged.reps}
            {effort ? ` @ ${effort}` : ''}
          </Text>
        </RowLine>
      </View>
      {/* Just the glyph, no disc: the row's one control, the skipped row's
          restore box plus a 2 dp slop. */}
      {onEdit ? (
        <Pressable
          onPress={onEdit}
          hitSlop={2}
          accessibilityRole="button"
          accessibilityLabel={t('training.editSet', { n: label })}
          className="h-10 w-10 items-center justify-center active:opacity-50"
        >
          <EditIcon color={muted} size={16} />
        </Pressable>
      ) : null}
    </View>
  );
};
