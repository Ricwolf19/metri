import { useMMKVString } from 'react-native-mmkv';

import { SettingKeys, storage, type ClockFormat } from './storage';

/** Reactive clock-format preference (24h / 12h); re-renders when Settings changes it. */
export const useClockFormat = (): ClockFormat => {
  const [raw] = useMMKVString(SettingKeys.clock, storage);
  return (raw as ClockFormat | undefined) ?? '24';
};
