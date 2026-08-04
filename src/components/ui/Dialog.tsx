import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from './Button';

export type DialogAction = {
  label: string;
  /** `destructive` renders red, `cancel` renders ghost; default is secondary. */
  style?: 'default' | 'destructive' | 'cancel';
  onPress?: () => void;
};

export type DialogOptions = {
  title: string;
  message?: string;
  actions: DialogAction[];
};

type DialogContextValue = {
  /** Imperative themed replacement for `Alert.alert` (same mental model). */
  show: (options: DialogOptions) => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const VARIANT: Record<NonNullable<DialogAction['style']>, 'secondary' | 'danger' | 'ghost'> = {
  default: 'secondary',
  destructive: 'danger',
  cancel: 'ghost',
};

/**
 * Themed dialog over `Modal` — the native `Alert.alert` box can't be styled at
 * all (and looks it, especially on Android). Mount once; call via `useDialog`.
 */
export const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [options, setOptions] = useState<DialogOptions | null>(null);

  const show = useCallback((next: DialogOptions) => setOptions(next), []);
  const close = () => setOptions(null);

  const run = (action: DialogAction) => {
    close();
    action.onPress?.();
  };

  const value = useMemo<DialogContextValue>(() => ({ show }), [show]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal visible={options !== null} transparent animationType="fade" onRequestClose={close}>
        <Pressable className="flex-1 items-center justify-center bg-black/60 px-8" onPress={close}>
          <Animated.View
            entering={ZoomIn.springify().damping(16).stiffness(220)}
            className="w-full"
          >
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
                    {options.actions.map((action) => (
                      <Button
                        key={action.label}
                        label={action.label}
                        variant={VARIANT[action.style ?? 'default']}
                        onPress={() => run(action)}
                      />
                    ))}
                  </View>
                </>
              ) : null}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within <DialogProvider>.');
  return ctx;
};
