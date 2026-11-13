import { Platform, Pressable, Text, View, type AccessibilityActionEvent } from 'react-native';

import { CheckIcon, SkipIcon, TrashIcon, XIcon } from '@/components/icons';
import { HoldButton } from '@/components/ui';
import type { SetLog } from '@/db/schema';
import { useT } from '@/i18n';
import type { Units } from '@/lib/storage';
import { useTheme } from '@/theme/theme-context';

import { MISSED } from '../adherence-colors';
import { loggedSetLabel } from '../session-a11y';
import { deleteSet } from '../session.repo';
import { weightText } from '../set-prefill';
import { WeightButton } from './WeightButton';

/**
 * Every row is at least 44 dp: the logged and skipped rows carry a 40 dp
 * control at their right edge, and the pending ones match so the list keeps
 * one rhythm.
 */
const ROW = 'min-h-11 flex-row items-center rounded-field';

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
      <Text className="flex-1 text-xs text-red-400">{text}</Text>
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
    <Text className="flex-1 text-xs text-ink-500">{legend}</Text>
  </View>
);

/**
 * A set already logged. Tapping the row reopens it in place for a correction;
 * the weight opens its picture (plates, pin, dumbbells); holding the bin
 * deletes it. For a screen reader the row is two elements, never a button
 * hiding buttons: the set read whole ("Set 2: 60 kg, 8 reps, 2 in reserve"),
 * which edits on activate and offers the picture as an action, then the delete.
 */
export const LoggedRow = ({
  label,
  logged,
  unit,
  warmup,
  failureLabel,
  editHint,
  onEdit,
  onWeightPress,
}: {
  label: string;
  logged: SetLog;
  unit: Units;
  warmup: boolean;
  failureLabel: string;
  editHint?: string;
  onEdit?: () => void;
  onWeightPress?: () => void;
}) => {
  const t = useT();
  const { brandContrast, danger } = useTheme();
  const twoDumbbells = logged.load?.kind === 'dumbbell' && logged.load.hands === 2;
  const showLoad = t('loadView.title');
  const actions = [
    // Android's double-tap is ACTION_CLICK; iOS's goes to `onAccessibilityTap`
    // (Fabric never routes it to `activate`, which would only sit in the rotor
    // under its raw name), as in `ReorderRow`.
    ...(onEdit && Platform.OS === 'android' ? [{ name: 'activate' }] : []),
    ...(onWeightPress ? [{ name: 'showLoad', label: showLoad }] : []),
  ];
  const onAction = (e: AccessibilityActionEvent) => {
    if (e.nativeEvent.actionName === 'activate') onEdit?.();
    else if (e.nativeEvent.actionName === 'showLoad') onWeightPress?.();
  };
  return (
    <Pressable
      onPress={onEdit}
      disabled={!onEdit}
      // Touch only: the screen reader gets the summary and the delete below as
      // two siblings, so neither is swallowed by this wrapper.
      accessible={false}
      className={`${ROW} bg-ink-850 py-0.5 pl-3 pr-0.5 active:bg-ink-800`}
    >
      <View
        accessible
        accessibilityRole={onEdit ? 'button' : undefined}
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
        )}
        accessibilityHint={onEdit ? editHint : undefined}
        accessibilityActions={actions.length ? actions : undefined}
        onAccessibilityAction={actions.length ? onAction : undefined}
        onAccessibilityTap={onEdit}
        className="min-w-0 flex-1 flex-row items-center"
      >
        <View
          className={[
            'mr-2.5 h-5 w-5 items-center justify-center rounded-full',
            warmup ? 'bg-ink-600' : 'bg-brand',
          ].join(' ')}
        >
          <CheckIcon color={brandContrast} size={13} />
        </View>
        <Text className="w-7 text-xs font-sans-semibold text-ink-400">{label}</Text>
        <View className="flex-1 flex-row items-center">
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
          <Text className="shrink text-sm font-sans-medium text-ink-100">
            {' '}
            × {logged.reps}
            {logged.rir != null ? ` · RIR ${logged.rir}` : ''}
            {logged.isFailure ? ` · ${failureLabel}` : ''}
          </Text>
        </View>
      </View>
      {/* Deleting a logged set cannot be undone: a hold, like every irreversible action. */}
      <HoldButton
        icon={<TrashIcon color={danger} size={15} />}
        accessibilityLabel={t('training.deleteSet', { n: label })}
        onComplete={() => deleteSet(logged.id)}
      />
    </Pressable>
  );
};
