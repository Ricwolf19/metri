import { useEffect, useState, type ReactNode } from 'react';

import { useTransitionSettled } from '@/lib/useTransitionSettled';

import { Skeleton } from './Skeleton';

type Props = {
  /** Position in a list of deferred blocks; each waits a frame longer than the one before. */
  order?: number;
  /**
   * What holds the space meanwhile: a skeleton block of the expected height by
   * default — the one loading look in the app (a spinner is for work the user
   * started, `BlockingOverlay`). `null` holds nothing (a block below the fold).
   */
  fallback?: ReactNode;
  children: ReactNode;
};

const STAGGER_MS = 16;

/**
 * Mounts its children only once the screen's transition has finished
 * (`useTransitionSettled`) and a frame per `order` later, so a screen's first
 * paint is its header and the blocks above the fold, and the push animation
 * never shares a frame with every chart and markdown body at once.
 */
export const Deferred = ({ order = 0, fallback, children }: Props) => {
  const settled = useTransitionSettled();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!settled) return;
    const timer = setTimeout(() => setReady(true), order * STAGGER_MS);
    return () => clearTimeout(timer);
  }, [settled, order]);
  if (ready) return <>{children}</>;
  return fallback === undefined ? <Skeleton className="min-h-40" /> : fallback;
};
