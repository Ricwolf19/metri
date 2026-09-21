import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { useT } from '@/i18n';

import { Button } from './Button';
import { cancelLast, type DialogAction } from './dialog-actions';
import { HoldButton } from './HoldButton';
import { Scrim } from './Scrim';

export type { DialogAction };

export type DialogOptions = {
  title: string;
  message?: string;
  actions: DialogAction[];
};

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
};

type DialogContextValue = {
  /** Imperative themed replacement for `Alert.alert` (same mental model). */
  show: (options: DialogOptions) => void;
  /** Standard gate: one emphasized confirm + a ghost cancel beneath it. Prefer over a hand-rolled two-button `show()`. */
  confirm: (options: ConfirmOptions) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const VARIANT: Record<
  Exclude<NonNullable<DialogAction['style']>, 'destructive'>,
  'brand' | 'secondary' | 'ghost'
> = {
  default: 'secondary',
  confirm: 'brand',
  cancel: 'ghost',
};

/**
 * Themed dialog over `Modal` — the native `Alert.alert` box can't be styled at
 * all (and looks it, especially on Android). Mount once; call via `useDialog`.
 */
export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const t = useT();
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const show = useCallback((next: DialogOptions) => setOptions(next), []);
  const close = () => setOptions(null);

  const confirm = useCallback(
    (o: ConfirmOptions) =>
      setOptions({
        title: o.title,
        message: o.message,
        actions: [
          {
            label: o.confirmLabel,
            style: o.destructive ? 'destructive' : 'confirm',
            onPress: o.onConfirm,
          },
          { label: o.cancelLabel ?? t('common.cancel'), style: 'cancel' },
        ],
      }),
    [t],
  );

  const run = (action: DialogAction) => {
    close();
    action.onPress?.();
  };

  const value = useMemo<DialogContextValue>(() => ({ show, confirm }), [show, confirm]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal visible={options !== null} transparent animationType="fade" onRequestClose={close}>
        <Scrim depth="medium">
          <Pressable className="flex-1 items-center justify-center px-8" onPress={close}>
            <Pressable
              className="w-full rounded-card border border-ink-700 bg-ink-850 p-5"
              onPress={() => {}}
            >
              {options ? (
                <>
                  <Text className="text-lg font-sans-bold text-ink-50">{options.title}</Text>
                  {options.message ? (
                    <Text className="mt-2 text-sm leading-6 text-ink-300">{options.message}</Text>
                  ) : null}
                  <View className="mt-5 gap-2">
                    {cancelLast(options.actions).map((action) =>
                      action.style === 'destructive' ? (
                        <HoldButton
                          key={action.label}
                          label={action.label}
                          onComplete={() => run(action)}
                        />
                      ) : (
                        <Button
                          key={action.label}
                          label={action.label}
                          variant={VARIANT[action.style ?? 'default']}
                          onPress={() => run(action)}
                        />
                      ),
                    )}
                  </View>
                </>
              ) : null}
            </Pressable>
          </Pressable>
        </Scrim>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within <DialogProvider>.');
  return ctx;
};
