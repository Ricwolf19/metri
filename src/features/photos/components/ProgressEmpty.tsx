import { Text, View } from 'react-native';

import { CameraIcon } from '@/components/icons';
import { Button, Card } from '@/components/ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/theme-context';

/** The timeline before the first check-in: what a check-in is, and the way into the camera. */
export const ProgressEmpty = ({ onStart }: { onStart: () => void }) => {
  const t = useT();
  const { muted } = useTheme();
  return (
    <Card className="mt-2 items-center py-8">
      <CameraIcon color={muted} size={32} />
      <Text className="mt-3 text-center text-base font-sans-semibold text-ink-50">
        {t('photos.empty')}
      </Text>
      <Text className="mt-2 text-center text-sm leading-5 text-ink-400">
        {t('photos.emptyBody')}
      </Text>
      <View className="mt-5 w-full">
        <Button variant="brand" label={t('photos.startCheckin')} onPress={onStart} />
      </View>
    </Card>
  );
};
