import { useState } from 'react';
import { Linking, View } from 'react-native';

import { TextLink } from '@/components/ui';
import { useT } from '@/i18n';

import { warmupVisualFor } from '../warmup-visuals';
import { WarmupFrames } from './ExerciseFrames';

/**
 * "Show demo" under a warm-up step whose name has a bundled demo; nothing
 * otherwise. Collapsed by default — a routine is read top to bottom, and six
 * animated plates at once would bury the list it illustrates.
 */
export const WarmupStepDemo = ({ name }: { name: string }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const visualId = warmupVisualFor(name);
  if (!visualId) return null;

  return (
    <View className="mt-1.5">
      <TextLink
        label={open ? t('warmup.hideDemo') : t('warmup.showDemo')}
        onPress={() => setOpen((o) => !o)}
      />
      {open ? (
        <View className="mt-2">
          <WarmupFrames visualId={visualId} label={name} />
          <TextLink
            center
            className="mt-1.5"
            label={t('exercise.illustrationCredit')}
            onPress={() => Linking.openURL('https://creativecommons.org/licenses/by-sa/4.0/')}
          />
        </View>
      ) : null}
    </View>
  );
};
