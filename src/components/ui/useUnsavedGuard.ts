import { useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';

import { useT } from '@/i18n';

import { useDialog } from './Dialog';

type Options = {
  dirty: boolean;
  /** Return `false` to stay on the screen (e.g. validation failed). */
  onSave: () => boolean | void;
  onDiscard?: () => void;
};

type Guard = {
  /** Navigate away without the prompt (after a save or a delete). Runs after
   * the next render so the listener already sees the screen as clean. */
  leave: (navigate: () => void) => void;
};

/**
 * Blocks leaving a screen (back chevron, hardware back, swipe) while `dirty`,
 * offering Save & leave / Discard / Cancel. The prevented action is replayed
 * after the choice; the navigator marks it as visited so it is not re-blocked.
 */
export const useUnsavedGuard = ({ dirty, onSave, onDiscard }: Options): Guard => {
  const navigation = useNavigation();
  const dialog = useDialog();
  const t = useT();
  const [pending, setPending] = useState<{ navigate: () => void } | null>(null);

  useEffect(() => {
    if (pending) pending.navigate();
  }, [pending]);

  usePreventRemove(dirty && !pending, ({ data }) => {
    dialog.show({
      title: t('editor.unsavedTitle'),
      message: t('editor.unsavedBody'),
      actions: [
        {
          label: t('editor.saveLeave'),
          onPress: () => {
            if (onSave() === false) return;
            navigation.dispatch(data.action);
          },
        },
        {
          label: t('editor.discard'),
          style: 'destructive',
          onPress: () => {
            onDiscard?.();
            navigation.dispatch(data.action);
          },
        },
        { label: t('common.cancel'), style: 'cancel' },
      ],
    });
  });

  return { leave: (navigate) => setPending({ navigate }) };
};
