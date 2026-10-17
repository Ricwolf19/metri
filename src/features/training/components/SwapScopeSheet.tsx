import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button, ChipRow, Sheet } from '@/components/ui';
import { SWAP_REASONS, type SwapReason } from '@/db/schema';
import type { SwapScope } from '@/features/training/session.repo';
import { useT, type TranslationKey } from '@/i18n';

type ScopeChoice = 'session' | 'two' | 'four' | 'cycle';

const SCOPES: ScopeChoice[] = ['session', 'two', 'four', 'cycle'];

/** What each reason usually calls for; the lifter can still change it. */
const SUGGESTED: Record<SwapReason, ScopeChoice> = {
  busy: 'session',
  discomfort: 'two',
  preference: 'cycle',
};

const toScope = (choice: ScopeChoice): SwapScope =>
  choice === 'session'
    ? { kind: 'session' }
    : choice === 'cycle'
      ? { kind: 'cycle' }
      : { kind: 'sessions', count: choice === 'two' ? 2 : 4 };

type Props = {
  visible: boolean;
  /** The variant about to replace the planned exercise. */
  exerciseName: string;
  onClose: () => void;
  onConfirm: (choice: { reason: SwapReason; scope: SwapScope }) => void;
};

/**
 * Asked right after a variant is picked: why, and for how long. The reason
 * preselects the scope a busy machine, a niggle or a preference usually call
 * for — this session, a couple of sessions, the rest of the cycle — and the
 * caption spells out what the longer scopes do to the plan.
 */
export const SwapScopeSheet = ({ visible, exerciseName, onClose, onConfirm }: Props) => {
  const t = useT();
  const [reason, setReason] = useState<SwapReason | null>(null);
  const [scope, setScope] = useState<ScopeChoice>('session');
  const pickReason = (r: SwapReason) => {
    setReason(r);
    setScope(SUGGESTED[r]);
  };
  const confirm = () => {
    onConfirm({ reason: reason ?? 'preference', scope: toScope(scope) });
    setReason(null);
    setScope('session');
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="px-5 pb-6">
        <Text className="text-lg font-sans-bold text-ink-50">
          {t('training.swapScopeTitle', { name: exerciseName })}
        </Text>
        <Text className="mt-4 text-xs font-sans-semibold uppercase tracking-wider text-ink-400">
          {t('training.swapReason')}
        </Text>
        <View className="mt-2">
          <ChipRow
            items={SWAP_REASONS.map((r) => ({
              value: r,
              label: t(`swapReason.${r}` as TranslationKey),
            }))}
            value={reason}
            onChange={pickReason}
          />
        </View>
        <Text className="mt-4 text-xs font-sans-semibold uppercase tracking-wider text-ink-400">
          {t('training.swapHowLong')}
        </Text>
        <View className="mt-2">
          <ChipRow
            items={SCOPES.map((s) => ({
              value: s,
              label: t(`training.swapScope.${s}` as TranslationKey),
            }))}
            value={scope}
            onChange={setScope}
          />
        </View>
        <Text className="mt-2 min-h-10 text-xs leading-4 text-ink-500">
          {scope === 'cycle'
            ? t('training.swapCycleHint')
            : scope === 'session'
              ? t('training.swapSessionHint')
              : t('training.swapSessionsHint')}
        </Text>
        <View className="mt-4">
          <Button variant="brand" label={t('training.swapConfirm')} onPress={confirm} />
        </View>
      </View>
    </Sheet>
  );
};
