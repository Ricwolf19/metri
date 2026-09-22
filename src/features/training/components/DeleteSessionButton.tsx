import { Pressable } from 'react-native';

import { TrashIcon } from '@/components/icons';
import { useDialog, useToast } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

import { syncTrainingReminder } from '../reminders';
import { deleteWorkout } from '../session.repo';

type Props = {
  logId: string;
  /** Smaller target for dense cards (the day sheet). */
  compact?: boolean;
  onDeleted?: () => void;
};

/**
 * Round trash control for a finished session: confirm dialog, then a hold to
 * delete. The program session list and the day sheet both use it, so every
 * entry point undoes the same things through `deleteWorkout`.
 */
export const DeleteSessionButton = ({ logId, compact = false, onDeleted }: Props) => {
  const t = useT();
  const dialog = useDialog();
  const toast = useToast();
  const { user } = useAuth();
  const { muted } = useTheme();

  const confirm = () =>
    dialog.confirm({
      title: t('training.deleteSessionTitle'),
      message: t('training.deleteSessionBody'),
      confirmLabel: t('training.holdDeleteSession'),
      destructive: true,
      onConfirm: () => {
        const rewound = deleteWorkout(logId);
        // Moving back a phase can change which weekdays are planned.
        if (rewound && user) void syncTrainingReminder(user.id);
        onDeleted?.();
        toast.success(t(rewound ? 'training.sessionDeletedRewound' : 'training.sessionDeleted'));
      },
    });

  return (
    <Pressable
      hitSlop={8}
      onPress={confirm}
      accessibilityRole="button"
      accessibilityLabel={t('training.deleteSession')}
      className={[
        'items-center justify-center rounded-full bg-ink-800 active:bg-ink-700',
        compact ? 'h-9 w-9' : 'h-10 w-10',
      ].join(' ')}
    >
      <TrashIcon color={muted} size={compact ? 16 : 18} />
    </Pressable>
  );
};
