import { useEffect, useState, type ReactNode } from 'react';
import { InteractionManager, View } from 'react-native';

type Props = {
  /** Position in a list of deferred blocks; each waits a frame longer than the one before. */
  order?: number;
  /** What holds the space meanwhile; a quiet block of the expected height by default. */
  fallback?: ReactNode;
  children: ReactNode;
};

const STAGGER_MS = 16;

/**
 * Mounts its children only once the current transition has finished (and a
 * frame per `order` later), so a screen's first paint is its header and the
 * blocks above the fold, not every chart and markdown body at once. The
 * fallback keeps the scroll height honest while the block is on its way.
 */
export const Deferred = ({ order = 0, fallback, children }: Props) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const task = InteractionManager.runAfterInteractions(() => {
      timer = setTimeout(() => setReady(true), order * STAGGER_MS);
    });
    return () => {
      task.cancel();
      if (timer) clearTimeout(timer);
    };
  }, [order]);
  if (ready) return <>{children}</>;
  return fallback ?? <View className="min-h-40" />;
};
