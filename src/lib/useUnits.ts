import { useMMKVString } from 'react-native-mmkv';

import { SettingKeys, storage, type Units } from './storage';

/** The kg/lb picker every screen renders; unit symbols are not translated. */
export const UNIT_SEGMENTS: readonly { value: Units; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
];

/**
 * Reactive weight-unit preference (MMKV hook). Profile and the workout screen
 * both edit it; a `useState(settings.getUnits())` copy per screen went stale
 * as soon as the other one changed it. Pushing the change to the account
 * profile stays with the caller (it needs the signed-in user).
 */
export const useUnits = () => {
  const [raw, setRaw] = useMMKVString(SettingKeys.units, storage);
  const units = (raw as Units | undefined) ?? 'kg';
  return { units, setUnits: (next: Units) => setRaw(next) };
};

/**
 * The unit of the kit — set logging, plates, bars, dumbbells, stacks and
 * everything measured on them (volume, e1RM, trends, session cards). A gym
 * can be lb in a kg country, so it is its own setting; until the lifter
 * chooses it, it follows the app-wide unit. A device setting: the account
 * profile carries only the app-wide one.
 */
export const useEquipmentUnits = () => {
  const [global] = useMMKVString(SettingKeys.units, storage);
  const [raw, setRaw] = useMMKVString(SettingKeys.equipmentUnits, storage);
  const units = ((raw ?? global) as Units | undefined) ?? 'kg';
  return { units, setUnits: (next: Units) => setRaw(next) };
};
