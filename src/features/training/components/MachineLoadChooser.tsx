import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChipRow } from '@/components/ui';
import { useT } from '@/i18n';

import type { MachineKind } from '../load';

type Family = 'plates' | 'stack';

/**
 * "How is this machine loaded?" in two short questions: plates or a pin
 * stack first, then — for plates — whether they go per side (two horns, ×2)
 * or all on one post (once). Three chips in a row read as one choice too many
 * in the gym. `value` is the saved kind, so the second question also reads an
 * existing answer back.
 */
export const MachineLoadChooser = ({
  value,
  onChange,
}: {
  value: MachineKind | null;
  onChange: (kind: MachineKind) => void;
}) => {
  const t = useT();
  const [family, setFamily] = useState<Family | null>(
    value === 'stack' ? 'stack' : value ? 'plates' : null,
  );
  const platesKind = value === 'post' || value === 'plates' ? value : null;

  return (
    <View className="gap-2.5">
      <Text className="text-xs font-sans-semibold text-ink-200">{t('load.machineKindTitle')}</Text>
      <ChipRow<Family>
        items={[
          { value: 'plates', label: t('load.machinePlates') },
          { value: 'stack', label: t('load.machineStack') },
        ]}
        value={family}
        onChange={(next) => {
          setFamily(next);
          if (next === 'stack') onChange('stack');
        }}
      />
      {family === 'plates' ? (
        <>
          <Text className="text-xs text-ink-400">{t('load.platesHow')}</Text>
          <ChipRow<MachineKind>
            items={[
              { value: 'plates', label: t('load.platesPerSide') },
              { value: 'post', label: t('load.platesOnePost') },
            ]}
            value={platesKind}
            onChange={onChange}
          />
        </>
      ) : null}
    </View>
  );
};
