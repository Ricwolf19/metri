import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { localDateKey } from '@/features/training/dates';
import { afterTransition } from '@/lib/useTransitionSettled';

import {
  connectHealth,
  disconnectHealth,
  grantedMetrics,
  healthAvailability,
  readHealthDays,
  type HealthAvailability,
} from './health-connect';
import { summarizeHealth, type HealthMetric, type HealthSummary } from './health-summary';

export type HealthState =
  | { phase: 'loading' }
  | { phase: Exclude<HealthAvailability, 'available'> }
  /** Available, nothing granted: the section offers to connect. */
  | { phase: 'off' }
  | { phase: 'ready'; granted: HealthMetric[]; summary: HealthSummary };

/** Eight days: today plus the seven the average reads. */
const DAYS_READ = 8;

/**
 * The Metrics tab's health numbers, read live — on focus (after the tab's
 * transition) and on every return to the foreground, since access is granted
 * and revoked in Health Connect's own screens. Nothing is cached: the read IS
 * the data's whole life on metri's side.
 */
export const useHealthData = () => {
  const navigation = useNavigation();
  const [state, setState] = useState<HealthState>({ phase: 'loading' });
  // Reads overlap (focus, foreground, a connect): only the latest one lands.
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    const land = (next: HealthState) => {
      if (mine === seq.current) setState(next);
    };
    const availability = await healthAvailability();
    if (availability !== 'available') return land({ phase: availability });
    const granted = await grantedMetrics();
    if (!granted.length) return land({ phase: 'off' });
    const days = await readHealthDays(granted, DAYS_READ);
    land({ phase: 'ready', granted, summary: summarizeHealth(days, localDateKey()) });
  }, []);

  useFocusEffect(
    useCallback(() => afterTransition(navigation, () => void load()), [navigation, load]),
  );
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void load();
    });
    return () => sub.remove();
  }, [load]);

  const connect = async () => {
    await connectHealth();
    await load();
  };
  const disconnect = async () => {
    await disconnectHealth();
    await load();
  };

  return { state, connect, disconnect };
};
