import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV — fast, synchronous key-value storage.
 *
 * Used for small values that must be read instantly without a flash on launch
 * (theme, units, onboarding flags, "last weight" cache). It does NOT replace
 * SQLite, which remains the relational source of truth. Requires a development
 * build; MMKV does not work in Expo Go.
 */
export const storage = createMMKV({ id: 'metri' });

export type Units = 'kg' | 'lb';

const Keys = {
  units: 'settings.units',
  onboarded: 'settings.onboarded',
} as const;

export const settings = {
  getUnits(): Units {
    return (storage.getString(Keys.units) as Units) ?? 'kg';
  },
  setUnits(units: Units) {
    storage.set(Keys.units, units);
  },
  hasOnboarded(): boolean {
    return storage.getBoolean(Keys.onboarded) ?? false;
  },
  setOnboarded(value: boolean) {
    storage.set(Keys.onboarded, value);
  },
};
