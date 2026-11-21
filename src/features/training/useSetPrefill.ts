import { useMMKVBoolean } from 'react-native-mmkv';

import { SettingKeys, storage } from '@/lib/storage';

import { prefillEnabled } from './set-prefill';

/**
 * Whether the live set row opens prefilled for a session of `templateId`,
 * reactive: Settings writes it while the workout screen may be mounted under
 * it. Absent, the choice is automatic (`prefillEnabled`: off on metri
 * Foundations); a flip of the switch stores the lifter's own on/off. A device
 * setting, like the ± steps.
 */
export const useSetPrefill = (templateId: string | null | undefined) => {
  const [choice, setChoice] = useMMKVBoolean(SettingKeys.setPrefill, storage);
  return {
    enabled: prefillEnabled(choice ?? null, templateId),
    setEnabled: (next: boolean) => setChoice(next),
  };
};
