import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';

/**
 * Longest a screen waits to hear its transition end. A screen mounted with no
 * transition at all (the first tab at launch, a tab mounted unfocused) never
 * hears one; past this it is settled anyway.
 */
const FALLBACK_MS = 450;

type TransitionEvents = {
  addListener: (
    type: 'transitionEnd',
    listener: (e: { data?: { closing?: boolean } }) => void,
  ) => () => void;
};

/**
 * Run `done` once the screen's transition IN has finished — the native stack
 * and the bottom tabs both emit `transitionEnd` for the route they animated —
 * or after the fallback. `InteractionManager.runAfterInteractions` cannot do
 * this any more: in RN 0.86 it is a deprecated stub that only defers to the
 * next tick (`setImmediate`), so work "after the transition" ran inside it.
 * Returns the cancel.
 */
export const afterTransition = (navigation: unknown, done: () => void): (() => void) => {
  let fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    done();
  };
  const timer = setTimeout(fire, FALLBACK_MS);
  const off = (navigation as TransitionEvents).addListener('transitionEnd', (e) => {
    if (!e?.data?.closing) fire();
  });
  return () => {
    fired = true;
    clearTimeout(timer);
    off();
  };
};

/** False until the screen's transition in has finished (see `afterTransition`). */
export const useTransitionSettled = (): boolean => {
  const navigation = useNavigation();
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (settled) return;
    return afterTransition(navigation, () => setSettled(true));
  }, [navigation, settled]);
  return settled;
};
