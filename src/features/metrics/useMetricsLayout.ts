import { useMMKVString } from 'react-native-mmkv';

import { parseJson } from '@/lib/safe-json';
import { SettingKeys, storage } from '@/lib/storage';

import type { MetricsLayout } from './layout';

const parse = (raw: string | undefined): MetricsLayout | null => {
  const value = parseJson<Partial<MetricsLayout> | null>(raw, null);
  if (!value) return null;
  return {
    order: Array.isArray(value.order) ? value.order : [],
    hidden: Array.isArray(value.hidden) ? value.hidden : [],
  };
};

/** Reactive metrics layout: reordering on the customize screen re-renders the tab behind it. */
export const useMetricsLayout = (): MetricsLayout | null => {
  const [raw] = useMMKVString(SettingKeys.metricsLayout, storage);
  return parse(raw);
};

/** Non-reactive read/write of the same layout, for screens that own the order while open. */
export const metricsLayout = {
  get: (): MetricsLayout | null => parse(storage.getString(SettingKeys.metricsLayout)),
  set: (layout: MetricsLayout): void => {
    storage.set(SettingKeys.metricsLayout, JSON.stringify(layout));
  },
};
