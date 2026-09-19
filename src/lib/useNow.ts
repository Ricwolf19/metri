import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/**
 * A stable "now" in epoch ms, re-read when the screen regains focus.
 *
 * Reading the clock during render is impure — the React Compiler rejects it,
 * and a screen that recomputes windows on every re-render produces drifting
 * results. Same shape as {@link useTodayKey}, one resolution coarser.
 */
export const useNow = (): number => {
  const [now, setNow] = useState(() => new Date().getTime());
  useFocusEffect(useCallback(() => setNow(new Date().getTime()), []));
  return now;
};
